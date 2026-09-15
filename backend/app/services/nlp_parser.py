import json
import time
from groq import Groq, RateLimitError, AuthenticationError
from app.config import settings

# ── Key pool ──────────────────────────────────────────────────────────────────
# Collects all non-empty keys from env vars in priority order:
# GROQ_API_KEY_1 … GROQ_API_KEY_5, then falls back to legacy GROQ_API_KEY.
def _build_key_pool() -> list[str]:
    numbered = [
        settings.GROQ_API_KEY_1,
        settings.GROQ_API_KEY_2,
        settings.GROQ_API_KEY_3,
        settings.GROQ_API_KEY_4,
        settings.GROQ_API_KEY_5,
    ]
    pool = [k.strip() for k in numbered if k.strip()]

    # Legacy fallback: use GROQ_API_KEY if not already in pool
    legacy = settings.GROQ_API_KEY.strip()
    if legacy and legacy not in pool:
        pool.append(legacy)

    return pool

_KEY_POOL: list[str] = []          # built on first use
_current_index: int  = 0           # which key we are currently using

def _get_pool() -> list[str]:
    global _KEY_POOL
    if not _KEY_POOL:
        _KEY_POOL = _build_key_pool()
    return _KEY_POOL

def _get_client() -> Groq | None:
    """Return a Groq client for the currently active key."""
    pool = _get_pool()
    if not pool:
        return None
    return Groq(api_key=pool[_current_index])

def _rotate_key(reason: str = "rate-limit") -> bool:
    """
    Advance to the next key in the pool.
    Returns True if a new key is available, False if we've exhausted them all.
    """
    global _current_index
    pool = _get_pool()
    next_index = _current_index + 1
    if next_index < len(pool):
        print(f"[Groq] Rotating key ({reason}): key #{_current_index + 1} → key #{next_index + 1} of {len(pool)}")
        _current_index = next_index
        return True
    print(f"[Groq] All {len(pool)} key(s) exhausted. Giving up.")
    return False


# ── Main parser ───────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are a highly accurate bank transaction parser. "
    "Extract the transaction details from the provided email text and return ONLY a valid JSON object matching this exact structure:\n"
    "{\n"
    '  "is_transaction": boolean (true only if this is a confirmed debit or credit alert, false if promotional, OTP, or generic),\n'
    '  "description": string (the name of the merchant or person. Keep it clean and short. E.g. "Swiggy", "Rahul Kumar"),\n'
    '  "amount": float (the transaction amount),\n'
    '  "type": "debit" or "credit",\n'
    '  "category": string (must be exactly one of: "Food & Dining", "Transport", "Groceries", "Shopping", "Entertainment", "Health", "Bills & Utilities", "Education", "Travel", "Personal Transfer", "Other"),\n'
    '  "emoji": string (a single emoji representing the chosen category),\n'
    '  "upi_ref": string or null (the UPI Reference Number or Transaction ID if present, otherwise null)\n'
    "}\n"
    "Ensure your response is valid JSON and nothing else."
)


def parse_bank_email(body: str) -> dict | None:
    """
    Parse a bank transaction alert email using Groq LLM.
    Automatically rotates API keys on 429 Rate-Limit errors.
    Returns a dict with transaction fields, or None if not parsable.
    """
    pool = _get_pool()
    if not pool:
        print("[LLM] No GROQ API keys configured. Skipping parsing.")
        return None

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": body},
    ]

    # Try every key in the pool before giving up
    attempts = 0
    max_attempts = len(pool)

    while attempts < max_attempts:
        client = _get_client()
        key_label = f"key #{_current_index + 1}/{len(pool)}"
        attempts += 1

        try:
            completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.0,
                response_format={"type": "json_object"},
            )

            response_json = completion.choices[0].message.content
            data = json.loads(response_json)

            if not data.get("is_transaction") or not data.get("amount") or data.get("amount") <= 0:
                return None

            return {
                "description": data.get("description", "Unknown"),
                "amount":      float(data.get("amount", 0.0)),
                "type":        data.get("type", "debit"),
                "category":    data.get("category", "Other"),
                "emoji":       data.get("emoji", "📦"),
                "upi_ref":     data.get("upi_ref"),
            }

        except RateLimitError:
            print(f"[Groq] Rate-limit hit on {key_label}. Rotating…")
            rotated = _rotate_key("rate-limit")
            if not rotated:
                return None
            time.sleep(0.5)

        except AuthenticationError:
            print(f"[Groq] Invalid API key on {key_label}. Rotating…")
            rotated = _rotate_key("invalid-key")
            if not rotated:
                print("[Groq] No more valid keys. Check your GROQ_API_KEY env vars in Render.")
                return None
            time.sleep(0.1)

        except Exception as e:
            print(f"[LLM Error] Failed to parse email using {key_label}: {e}")
            return None

    print("[Groq] Max rotation attempts reached. Skipping email.")
    return None
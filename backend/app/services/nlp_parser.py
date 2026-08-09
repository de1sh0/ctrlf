import json
from groq import Groq
from app.config import settings

# Initialize Groq client
# We will create it lazily inside the function to ensure env vars are loaded
client = None

def get_groq_client():
    global client
    if client is None:
        api_key = settings.GROQ_API_KEY
        if api_key:
            client = Groq(api_key=api_key)
    return client

def parse_bank_email(body: str) -> dict | None:
    """
    Parse any bank transaction alert email using Groq LLM.
    Returns dict with amount, description, type, category, emoji, upi_ref or None.
    """
    groq_client = get_groq_client()
    if not groq_client:
        print("[LLM] GROQ_API_KEY not found. Skipping parsing.")
        return None
        
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
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
                },
                {
                    "role": "user",
                    "content": body
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        response_json = chat_completion.choices[0].message.content
        data = json.loads(response_json)
        
        if not data.get("is_transaction") or not data.get("amount") or data.get("amount") <= 0:
            return None
            
        return {
            "description": data.get("description", "Unknown"),
            "amount": float(data.get("amount", 0.0)),
            "type": data.get("type", "debit"),
            "category": data.get("category", "Other"),
            "emoji": data.get("emoji", "📦"),
            "upi_ref": data.get("upi_ref")
        }
    except Exception as e:
        print(f"[LLM Error] Failed to parse email: {e}")
        return None
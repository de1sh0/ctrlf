import re
import re as _re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

nlp = spacy.load("en_core_web_sm")

CATEGORY_EXAMPLES = {
    "Food & Dining": [
        "zomato order food delivery swiggy dinner lunch breakfast",
        "restaurant cafe coffee tea meal biryani pizza burger",
        "dominos mcdonalds kfc subway hotel dining eating",
        "blinkit zepto grocery food quick commerce",
        "stall canteen mess tiffin dabba",
    ],
    "Transport": [
        "uber ola rapido cab ride taxi auto rickshaw",
        "petrol fuel diesel pump filling station",
        "metro bus train irctc ticket travel commute",
        "parking toll highway fastag rapido bike",
    ],
    "Groceries": [
        "bigbasket dmart reliance fresh vegetables fruits",
        "kirana store grocery supermarket market shopping",
        "milk eggs bread rice dal flour oil",
        "nature basket spencers more supermarket",
    ],
    "Shopping": [
        "amazon flipkart myntra ajio nykaa meesho",
        "mall store purchase clothes shoes fashion",
        "electronics gadget mobile phone laptop",
        "snapdeal shopclues online shopping delivery",
    ],
    "Entertainment": [
        "netflix amazon prime hotstar disney subscription",
        "movie theatre pvr inox bookmyshow ticket",
        "spotify gaana youtube music streaming",
        "gaming steam playstation xbox recharge",
    ],
    "Health": [
        "apollo pharmacy medplus netmeds medicine tablet",
        "doctor hospital clinic consultation checkup",
        "lab test diagnostic health insurance",
        "gym fitness yoga membership subscription",
    ],
    "Bills & Utilities": [
        "electricity bill payment bses tata power",
        "water bill gas cylinder lpg booking",
        "airtel jio vi vodafone broadband recharge",
        "postpaid prepaid mobile internet data plan",
    ],
    "Education": [
        "udemy coursera unacademy byju subscription",
        "school college tuition fees admission",
        "book stationery course training workshop",
        "coaching institute class learning education",
    ],
    "Travel": [
        "flight airline indigo spicejet air india ticket",
        "hotel oyo makemytrip booking holiday trip",
        "irctc train bus ticket journey vacation",
        "goibibo cleartrip yatra travel booking",
    ],
    "Personal Transfer": [
        "personal transfer sent money friend family",
        "kumar sharma patel singh gupta verma",
        "paid person individual upi transfer",
        "bhai sister brother uncle aunt",
    ],
    "Other": [
        "transfer payment miscellaneous other unknown",
        "general expense transaction",
    ],
}

# Build TF-IDF vectorizer
all_texts = []
all_labels = []
for category, examples in CATEGORY_EXAMPLES.items():
    for ex in examples:
        all_texts.append(ex)
        all_labels.append(category)

vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
tfidf_matrix = vectorizer.fit_transform(all_texts)

CATEGORY_EMOJIS = {
    "Food & Dining":     "🍕",
    "Transport":         "🚗",
    "Groceries":         "🛒",
    "Shopping":          "🛍️",
    "Entertainment":     "🎬",
    "Health":            "💊",
    "Bills & Utilities": "💡",
    "Education":         "📚",
    "Travel":            "✈️",
    "Personal Transfer": "👤",
    "Other":             "📦",
}

KNOWN_SERVICES = {
    "google", "amazon", "flipkart", "swiggy", "zomato", "uber", "ola",
    "netflix", "spotify", "airtel", "jio", "hdfc", "icici", "sbi",
    "paytm", "phonepe", "gpay", "razorpay", "myntra", "ajio", "nykaa",
    "bigbasket", "blinkit", "zepto", "dunzo", "rapido", "meesho",
    "bookmyshow", "irctc", "makemytrip", "oyo", "hotstar", "prime",
    "tata", "reliance", "dmart", "apple", "microsoft", "facebook",
    "instagram", "youtube", "canva", "notion", "figma", "github",
}

PERSON_NAME_PATTERN = _re.compile(
    r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}$'
)


def is_person_name(description: str) -> bool:
    """Detect if description looks like a person name."""
    desc = description.strip()

    if not desc:
        return False

    # If it matches a known service — definitely not a person
    if any(service in desc.lower() for service in KNOWN_SERVICES):
        return False

    # Matches typical Indian full name pattern (2-5 capitalized words)
    if PERSON_NAME_PATTERN.match(desc):
        words = desc.split()
        if 2 <= len(words) <= 5:
            return True

    # All words title case, no digits, not a known service
    words = desc.split()
    if (
        len(words) >= 2
        and all(w[0].isupper() for w in words if w)
        and not any(char.isdigit() for char in desc)
        and not any(service in desc.lower() for service in KNOWN_SERVICES)
    ):
        return True

    return False


def classify_category(description: str) -> tuple[str, str]:
    """Returns (category, emoji)"""
    if not description:
        return "Other", "📦"

    # Detect person name first
    if is_person_name(description):
        return "Personal Transfer", "👤"

    query_vec = vectorizer.transform([description.lower()])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    # Low confidence — treat as personal transfer or other
    if best_score < 0.1:
        return "Personal Transfer", "👤"

    category = all_labels[best_idx]
    return category, CATEGORY_EMOJIS.get(category, "📦")


def parse_hdfc_email(body: str) -> dict | None:
    """
    Parse HDFC Bank transaction alert email.
    Returns dict with amount, description, type, upi_ref or None.
    """
    body_lower = body.lower()

    # Only process transaction emails
    if not any(w in body_lower for w in ["debited", "credited", "rs.", "inr", "upi txn"]):
        return None

    # Extract amount
    amount_patterns = [
        r"rs\.?\s*([0-9,]+\.?[0-9]*)\s*has been",
        r"rs\.?\s*([0-9,]+\.?[0-9]*)\s*(?:debited|credited)",
        r"(?:rs\.?|inr|₹)\s*([0-9,]+\.?[0-9]*)",
        r"([0-9,]+\.?[0-9]*)\s*(?:rs\.?|inr)",
    ]
    amount = None
    for pattern in amount_patterns:
        match = re.search(pattern, body_lower)
        if match:
            try:
                amount = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                continue

    if not amount or amount <= 0:
        return None

    # Extract UPI reference number
    upi_ref = None
    upi_ref_patterns = [
        r"(?:upi|transaction|txn)\s*reference\s*(?:no[\.\:]*|number|id|#)?\s*(?:is\s+)?([0-9]{10,20})",
        r"reference\s+number\s+is\s+([0-9]{10,20})",
        r"(?:upi|txn|ref(?:erence)?)\s*(?:no[\.\:]*|number|id|#)?\s*(?:is\s+)?([0-9]{10,20})",
        r"ref\s*no[\.\:]*\s*([0-9]{10,20})",
        r"\b([0-9]{12,20})\b",
    ]
    for pattern in upi_ref_patterns:
        match = re.search(pattern, body_lower)
        if match:
            upi_ref = match.group(1).strip()
            break

    # Determine transaction type
    tx_type = "debit"
    if "credited" in body_lower:
        tx_type = "credit"

    # Extract merchant/recipient name
    description = ""

    # UPI recipient patterns
    upi_patterns = [
        r"(?:towards|to)\s+vpa\s+\S+\s*\(([^)]+)\)",
        r"(?:towards|to)\s+vpa\s+\S+\s+(.+?)(?:\s+on\s|\s+via|\.|$)",
    ]
    for pattern in upi_patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            name = match.group(1).strip().title()
            if len(name) > 2 and "account" not in name.lower():
                description = name
                break

    if not description:
        exact_upi_patterns = [
            r"to\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+on\s|\s+via|\s+upi|\.|$)"
        ]
        for pattern in exact_upi_patterns:
            match = re.search(pattern, body)
            if match:
                name = match.group(1).strip().title()
                if len(name) > 2 and "account" not in name.lower():
                    description = name
                    break

    # Info/narration field
    if not description:
        info_patterns = [
            r"\binfo[\:\-]+\s*([^\.\n]+)",
            r"\bnarration[\:\-]+\s*([^\.\n]+)",
            r"\bremarks[\:\-]+\s*([^\.\n]+)",
            r"\btowards[\:\-]+\s*([^\.\n]+)",
        ]
        for pattern in info_patterns:
            match = re.search(pattern, body_lower)
            if match:
                description = match.group(1).strip().title()
                break

    # spaCy NER fallback
    if not description:
        doc = nlp(body)
        orgs = [
            ent.text for ent in doc.ents
            if ent.label_ in ("ORG", "PERSON", "PRODUCT")
            and "hdfc" not in ent.text.lower()
            and "bank" not in ent.text.lower()
        ]
        if orgs:
            description = orgs[0].strip()

    if not description:
        description = "UPI Transaction"

    # Clean up
    description = re.sub(r'\s+', ' ', description).strip()[:100]

    category, emoji = classify_category(description)

    return {
        "description": description,
        "amount": amount,
        "type": tx_type,
        "category": category,
        "emoji": emoji,
        "upi_ref": upi_ref,
    }
import re
from typing import Dict, Any
from app.services.llm import llm_service

def extract_entities_local(text: str, translated_text: str) -> Dict[str, Any]:
    """
    Local regex-based entity extractor. Runs on both raw and translated text.
    """
    # Combine text for broader coverage
    combined_text = f"{text} {translated_text}"
    
    # 1. Extract Email
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    email_match = re.search(email_pattern, combined_text)
    email = email_match.group(0) if email_match else ""
    
    # 2. Extract Phone Number
    # Match patterns like: +91-XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX, +1-XXX-XXX-XXXX
    phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}|[6-9]\d{9}'
    phone_match = re.search(phone_pattern, combined_text)
    phone = phone_match.group(0) if phone_match else ""
    
    # 3. Extract Order ID
    # Match pattern like: ORD-12345, #12345, order-12345, order id: 12345, etc.
    order_pattern = r'\b(ORD|order|id)?[-#\s]*\d{5,8}\b|\bORD-\d+\b'
    order_matches = re.finditer(order_pattern, combined_text, re.IGNORECASE)
    order_id = ""
    for match in order_matches:
        match_str = match.group(0)
        # Verify it has digits
        if any(char.isdigit() for char in match_str):
            # Clean order id - e.g. ORD-88271 or just ORD-99823
            # If it's just numbers, let's prefix it with ORD- or return as is
            cleaned_order = re.sub(r'[^\w-]', '', match_str).upper()
            if cleaned_order.startswith("ORD-") or cleaned_order.isdigit() or len(cleaned_order) > 4:
                # Format check
                if cleaned_order.isdigit():
                    order_id = f"ORD-{cleaned_order}"
                else:
                    order_id = cleaned_order
                break
                
    # Fallback order search for specific sample format: e.g. "ord-99823"
    if not order_id:
        fallback_order = re.search(r'\bord-\d+\b', combined_text.lower())
        if fallback_order:
            order_id = fallback_order.group(0).upper()
            
    # 4. Extract Amount
    # Match pattern like: 5000 rs, 5000 rupees, $50, 50.00 $, Rs. 5000, 5000 INR
    amount_pattern = r'\$\s*\d+(?:\.\d{2})?|\b\d+(?:\.\d{2})?\s*(?:rs|rupees|inr|usd|\$)\b|(?:\brs\.?|inr|usd)\s*\d+(?:\.\d{2})?\b|\bamount\s*(?:was|is)?\s*(\d+)\b'
    amount_match = re.search(amount_pattern, combined_text, re.IGNORECASE)
    amount = ""
    if amount_match:
        amount = amount_match.group(0)
        # Normalize the amount string (e.g. RS 5000 -> Rs. 5000 or USD 50 -> $50)
        amount = re.sub(r'\s+', ' ', amount)
    else:
        # Check if we can find a lone number next to refund keywords
        if "refund" in combined_text.lower() or "cancellation" in combined_text.lower():
            lone_number = re.search(r'\b\d{3,5}\b', combined_text)
            if lone_number:
                amount = f"Rs. {lone_number.group(0)}"
                
    return {
        "order_id": order_id,
        "amount": amount,
        "email": email,
        "phone": phone
    }

from app.services.gemini_service import gemini_extract_entities

def extract_entities(text: str, translated_text: str) -> Dict[str, Any]:
    """
    Main entry point for entity extraction.
    """
    if not text or not text.strip():
        return {"order_id": "", "amount": "", "email": "", "phone": ""}
        
    return gemini_extract_entities(text, translated_text)


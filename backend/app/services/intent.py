import re
from typing import Dict, Any
from app.services.llm import llm_service

INTENT_KEYWORDS = {
    "Refund Request": [r'refund', r'money back', r'reimburse', r'return money', r'return product', r'refunds'],
    "Payment Issue": [r'payment', r'charge', r'billing', r'transaction', r'deducted', r'fail', r'pay', r'credit card', r'debit card'],
    "Order Delay": [r'delay', r'late', r'shipping', r'delivery', r'tracking', r'not arrived', r'where is my', r'arrived'],
    "Login Issue": [r'login', r'sign in', r'password', r'reset', r'lockout', r'credentials', r'locked out', r'log in'],
    "Security Issue": [r'security', r'hack', r'unauthorized', r'leak', r'compromise', r'fraud', r'alert', r'breach'],
    "Subscription Problem": [r'subscription', r'subscribe', r'premium', r'plan', r'membership', r'billing cycle'],
    "Cancellation": [r'cancel', r'cancellation', r'terminate', r'stop charge', r'close my sub'],
    "Account Issue": [r'account', r'profile', r'delete account', r'change email', r'details', r'username'],
    "Technical Bug": [r'bug', r'error', r'crash', r'broken', r'not working', r'fail', r'glitch', r'freeze', r'black screen'],
    "Feature Request": [r'feature', r'request', r'suggest', r'improve', r'would be great', r'add option', r'want a button', r'add support'],
    "Spam": [r'voucher', r'gift card', r'free', r'win', r'click here', r'advert', r'spam', r'make money', r'earn cash', r'lottery'],
    "Out Of Scope": [r'restaurant', r'weather', r'pizza', r'joke', r'food', r'recommend', r'how are you', r'what is your', r'hi there', r'hello']
}

def classify_intent_local(translated_text: str) -> Dict[str, Any]:
    """
    Local keyword-based intent classifier. Runs on translated English text.
    """
    if not translated_text or not translated_text.strip():
        return {"intent": "Out Of Scope", "confidence": 1.0}
        
    text_lower = translated_text.lower()
    
    # Store match counts
    matches = {intent: 0 for intent in INTENT_KEYWORDS.keys()}
    
    for intent, patterns in INTENT_KEYWORDS.items():
        for pattern in patterns:
            # Check for word boundary or direct containment
            if re.search(pattern, text_lower):
                matches[intent] += 1
                
    # Sort by number of matches
    sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)
    best_intent, max_matches = sorted_matches[0]
    
    if max_matches == 0:
        # Fallback logic: check if it looks like general angry venting -> Complaint
        complaint_words = ["angry", "bad", "worst", "terrible", "disappointed", "sucks", "hate", "useless", "support", "help"]
        if any(word in text_lower for word in complaint_words):
            return {"intent": "Complaint", "confidence": 0.8}
        # Otherwise, Out Of Scope or general Complaint
        if len(text_lower.split()) < 3: # very short like 'hello'
            return {"intent": "Out Of Scope", "confidence": 0.6}
        return {"intent": "Complaint", "confidence": 0.6}
        
    # Check if the highest match intent is "Out Of Scope" but there are other matches
    if best_intent == "Out Of Scope" and sorted_matches[1][1] > 0:
        best_intent, max_matches = sorted_matches[1]

    confidence = min(0.7 + (max_matches * 0.1), 0.99)
    
    return {
        "intent": best_intent,
        "confidence": confidence
    }

from app.services.gemini_service import gemini_classify_intent

def classify_intent(text: str, translated_text: str) -> Dict[str, Any]:
    """
    Main entry point for intent classification.
    """
    if not text or not text.strip():
        return {"intent": "Out Of Scope", "confidence": 1.0}
        
    return gemini_classify_intent(text, translated_text)


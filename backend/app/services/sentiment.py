from typing import Dict, Any
from app.services.llm import llm_service

POSITIVE_WORDS = ["great", "thanks", "good", "thank you", "awesome", "happy", "excellent", "solved", "appreciate", "helpful", "perfect", "resolved"]
NEGATIVE_WORDS = ["bad", "worst", "fail", "angry", "delay", "broken", "crap", "useless", "horrible", "frustrated", "unhappy", "error", "refund", "charge", "poor", "terrible", "sucks", "hate", "wrong", "lost", "waste", "cheat", "scam", "ridiculous"]

def analyze_sentiment_local(translated_text: str) -> Dict[str, Any]:
    """
    Local keyword-based sentiment analyzer. Runs on translated English text.
    """
    if not translated_text or not translated_text.strip():
        return {"sentiment": "Neutral", "confidence": 1.0}
        
    text_lower = translated_text.lower()
    
    pos_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    neg_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)
    
    # Check for exclamation marks or capitalization which indicates strong sentiment
    exclamations = text_lower.count("!")
    
    if neg_count > pos_count:
        sentiment = "Negative"
        # Confidence increases with more negative keywords or exclamation marks
        confidence = min(0.75 + (neg_count * 0.05) + (exclamations * 0.02), 0.99)
    elif pos_count > neg_count:
        sentiment = "Positive"
        confidence = min(0.75 + (pos_count * 0.05) + (exclamations * 0.02), 0.99)
    else:
        sentiment = "Neutral"
        confidence = 0.8
        
    return {
        "sentiment": sentiment,
        "confidence": confidence
    }

from app.services.gemini_service import gemini_analyze_sentiment

def analyze_sentiment(text: str, translated_text: str) -> Dict[str, Any]:
    """
    Main entry point for sentiment analysis.
    """
    if not text or not text.strip():
        return {"sentiment": "Neutral", "confidence": 1.0}
        
    return gemini_analyze_sentiment(text, translated_text)


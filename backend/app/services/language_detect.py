import re
from typing import Dict, Any
from app.services.llm import llm_service

def detect_language_local(text: str) -> Dict[str, Any]:
    """
    Heuristic rule-based language detector supporting English, Hindi, Gujarati, and Mixed variations.
    """
    if not text or not text.strip():
        return {"language": "English", "confidence": 1.0}
        
    text_lower = text.lower()
    
    # Devanagari Unicode Range (Hindi): \u0900-\u097F
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text))
    # Gujarati Unicode Range: \u0A80-\u0AFF
    has_gujarati = bool(re.search(r'[\u0A80-\u0AFF]', text))
    # Check for English characters (Latin alphabets)
    has_latin = bool(re.search(r'[a-zA-Z]', text))
    
    # Keyword checks for Hinglish/Gujlish
    hinglish_keywords = ["paisa", "rupay", "kab", "aayega", "nahi", "ho", "raha", "hai", "mujhe", "mera", "app", "refund", "lat", "problem", "kharaab", "chal", "kaam", "chahiye", "please", "help", "payment", "delay", "cancel"]
    gujlish_keywords = ["paisa", "kare", "thay", "nathi", "aavyu", "kem", "chhe", "mane", "maru", "bilamb", "modu", "dhanya", "problem", "chalatu", "joie", "please", "help", "payment", "delay", "cancel"]
    
    hinglish_count = sum(1 for word in hinglish_keywords if f" {word} " in f" {text_lower} ")
    gujlish_count = sum(1 for word in gujlish_keywords if f" {word} " in f" {text_lower} ")
    
    # Logic to classify into the 6 specific target languages
    if (has_devanagari and has_gujarati) or (has_devanagari and gujlish_count > 0) or (has_gujarati and hinglish_count > 0):
        return {"language": "Mixed Hindi-Gujarati-English", "confidence": 0.9}
        
    if has_devanagari:
        if has_latin:
            return {"language": "Mixed Hindi-English", "confidence": 0.95}
        return {"language": "Hindi", "confidence": 0.98}
        
    if has_gujarati:
        if has_latin:
            return {"language": "Mixed Gujarati-English", "confidence": 0.95}
        return {"language": "Gujarati", "confidence": 0.98}
        
    if has_latin:
        # Check if Hindi-English or Gujarati-English transliterated
        # (Mixed Hinglish or Gujlish)
        is_mixed_hindi = hinglish_count > 2 or ("meri" in text_lower or "mera" in text_lower or "hai" in text_lower or "karo" in text_lower)
        is_mixed_guj = gujlish_count > 2 or ("chhe" in text_lower or "nathi" in text_lower or "aavyu" in text_lower or "mane" in text_lower)
        
        if is_mixed_hindi and is_mixed_guj:
            return {"language": "Mixed Hindi-Gujarati-English", "confidence": 0.88}
        elif is_mixed_hindi:
            return {"language": "Mixed Hindi-English", "confidence": 0.92}
        elif is_mixed_guj:
            return {"language": "Mixed Gujarati-English", "confidence": 0.92}
            
        return {"language": "English", "confidence": 0.99}
        
    return {"language": "English", "confidence": 0.7}

from app.services.gemini_service import gemini_detect_language

def detect_language(text: str) -> Dict[str, Any]:
    """
    Main entry point for language detection.
    """
    return gemini_detect_language(text)


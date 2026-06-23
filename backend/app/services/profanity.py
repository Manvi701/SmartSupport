import re
from typing import Dict, Any
from app.services.llm import llm_service

PROFANITY_WORDS = [
    # English
    r'\bfuck(ing|er|ed)?\b',
    r'\bshit(ty)?\b',
    r'\basshole\b',
    r'\bbitch(es|ing)?\b',
    r'\bbastard\b',
    r'\bcunt\b',
    r'\bidiot\b',
    r'\bstupid\b',
    
    # Hindi / Gujarati transliterated
    r'\bsaala\b',
    r'\bsala\b',
    r'\bkamina\b',
    r'\bkutting\b',
    r'\bkutta\b',
    r'\bkutte\b',
    r'\bchutiya\b',
    r'\bharami\b',
    
    # Hindi Devanagari script
    r'कुत्ता',
    r'कमीना',
    r'साला',
    r'हरामी',
    r'चूतिया',
    r'गांड',
    
    # Gujarati script
    r'કૂતરો',
    r'સાળો',
    r'હરામી',
    r'ભોસડી',
    r'ચોદ',
]

def clean_profanity_local(text: str) -> Dict[str, Any]:
    """
    Local regex-based profanity detector and text cleaner.
    """
    if not text:
        return {"cleaned_text": "", "profanity_detected": False}
        
    cleaned = text
    profanity_detected = False
    
    for pattern in PROFANITY_WORDS:
        # Search for profanity (case insensitive)
        matches = list(re.finditer(pattern, cleaned, re.IGNORECASE))
        if matches:
            profanity_detected = True
            # Replace matches with asterisks of the same length
            for match in reversed(matches):
                start, end = match.span()
                replacement = "*" * (end - start)
                cleaned = cleaned[:start] + replacement + cleaned[end:]
                
    return {
        "cleaned_text": cleaned,
        "profanity_detected": profanity_detected
    }

def filter_profanity(text: str) -> Dict[str, Any]:
    """
    Main entry point for profanity filtering.
    """
    if not text or not text.strip():
        return {"cleaned_text": "", "profanity_detected": False}
        
    # 1. Try LLM
    system_prompt = "You are a profanity filtering service. Analyze the text for profanity, offensive language, or slurs (English, Hindi, or Gujarati). If found, clean the text by replacing offensive words with asterisks (****). Output a JSON object with keys: 'cleaned_text' (string) and 'profanity_detected' (boolean)."
    user_prompt = f"Text to clean: '{text}'"
    
    result = llm_service.generate_json(system_prompt, user_prompt)
    if result and "cleaned_text" in result:
        return {
            "cleaned_text": str(result.get("cleaned_text")),
            "profanity_detected": bool(result.get("profanity_detected", False))
        }
        
    # 2. Local Fallback
    return clean_profanity_local(text)

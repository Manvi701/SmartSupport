import re
from typing import Dict, Any
from app.services.llm import llm_service

PROMO_KEYWORDS = [
    r'buy now', r'click here', r'free money', r'earn cash', r'gift card',
    r'voucher', r'limited offer', r'guaranteed win', r'casino', r'lottery',
    r'claim now', r'earn money', r'make money', r'viagra', r'subscribe now',
    r'click link', r'visit website', r'get free', r'congratulations'
]

def count_emojis(text: str) -> int:
    """
    Counts unicode emojis in text.
    """
    # Unicode emoji ranges
    emoji_pattern = re.compile(r'[\u2600-\u27BF]|[\u1F300-\u1F6FF]|[\u1F900-\u1F9FF]|[\u1F1E0-\u1F1FF]')
    return len(emoji_pattern.findall(text))

def detect_spam_local(text: str) -> Dict[str, Any]:
    """
    Heuristic rule-based spam detection scoring.
    """
    if not text or not text.strip():
        return {"spam": True, "spam_score": 1.0, "reason": "Empty or meaningless message"}

    text_lower = text.lower()
    text_stripped = text.strip()
    words = text_stripped.split()
    
    # 1. Empty/meaningless text or very short gibberish
    if len(words) < 2 and len(text_stripped) < 4:
        return {"spam": True, "spam_score": 0.9, "reason": "Too short or meaningless content"}
        
    # Check if text is just a repeat of a single character (e.g., "aaaaaaaa")
    char_groups = re.findall(r'(.)\1{4,}', text_lower)
    if char_groups and len(text_stripped) > 5:
        # Check if the text is mostly just repeating characters
        unique_chars = set(text_lower.replace(" ", ""))
        if len(unique_chars) <= 2:
            return {"spam": True, "spam_score": 0.95, "reason": "Random character sequence detected"}

    # 2. Repeated words (e.g., "BUY NOW BUY NOW BUY NOW")
    repeated_words_detected = False
    if len(words) >= 4:
        # Simple sliding check for identical word sequence repeats
        word_freq = {}
        for w in words:
            word_freq[w] = word_freq.get(w, 0) + 1
        # If any significant word makes up more than 50% of a longer text
        for w, freq in word_freq.items():
            if len(w) > 2 and freq / len(words) >= 0.5 and len(words) > 5:
                repeated_words_detected = True
                break

    # 3. Excessive Emojis
    emoji_count = count_emojis(text)
    excessive_emojis = emoji_count > 4

    # 4. Promotional content
    promo_score = 0.0
    matched_keywords = []
    for pattern in PROMO_KEYWORDS:
        if re.search(pattern, text_lower):
            promo_score += 0.35
            matched_keywords.append(pattern.replace(r'\b', ''))
            
    # Calculate aggregate score
    spam_score = 0.0
    reasons = []
    
    if repeated_words_detected:
        spam_score += 0.6
        reasons.append("Repeated word sequences")
    if excessive_emojis:
        spam_score += 0.5
        reasons.append("Excessive emoji usage")
    if promo_score > 0.0:
        spam_score += min(promo_score, 0.8)
        reasons.append(f"Promotional content: {', '.join(matched_keywords[:2])}")
        
    # Gibberish sequence score modifier
    # If entropy is low (e.g., very few vowels, or word length averages > 20)
    avg_word_len = sum(len(w) for w in words) / len(words) if words else 0
    if avg_word_len > 18:
        spam_score += 0.7
        reasons.append("Long random character sequences")

    # Clamp spam score
    spam_score = min(spam_score, 1.0)
    
    # Decide status
    is_spam = spam_score >= 0.70
    
    reason = " | ".join(reasons) if reasons else "Clean customer message"
    if not is_spam and spam_score > 0.3:
        reason = "Suspected spam: " + reason
        
    return {
        "spam": is_spam,
        "spam_score": round(spam_score, 2),
        "reason": reason
    }

def detect_spam(text: str) -> Dict[str, Any]:
    """
    Main entry point for spam detection.
    """
    if not text or not text.strip():
        return {"spam": True, "spam_score": 1.0, "reason": "Empty or meaningless message"}
        
    # 1. Try LLM
    system_prompt = (
        "You are an expert spam detection service. Analyze if the text is spam, bot gibberish, promotional, "
        "or meaningless content. Output a JSON object with keys: 'spam' (boolean), 'spam_score' (float), and 'reason' (string)."
    )
    user_prompt = f"Text to analyze: '{text}'"
    
    result = llm_service.generate_json(system_prompt, user_prompt)
    if result and "spam" in result:
        return {
            "spam": bool(result.get("spam")),
            "spam_score": float(result.get("spam_score", 0.0)),
            "reason": str(result.get("reason", ""))
        }
        
    # 2. Local Fallback
    return detect_spam_local(text)

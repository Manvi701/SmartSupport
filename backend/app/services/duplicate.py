import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Ticket

# Configurable threshold (default 70%)
SIMILARITY_THRESHOLD = 0.70

def clean_and_tokenize(text: str):
    """
    Cleans text and breaks it into a set of lowercased alphanumeric words, excluding standard stop words.
    """
    if not text:
        return set()
    cleaned = re.sub(r'[^\w\s]', '', text.lower())
    words = cleaned.split()
    stopwords = {"i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"}
    return {w for w in words if w not in stopwords and len(w) > 1}

def detect_duplicate(text: str, db: Session) -> Dict[str, Any]:
    """
    Checks if a ticket is a duplicate of any existing ticket in the database.
    Calculates Jaccard similarity. Returns matched ID and similarity percentage.
    """
    if not text or not text.strip() or not db:
        return {
            "duplicate_ticket": False,
            "duplicate_ticket_id": None,
            "matched_ticket_id": None,
            "similarity_score": 0.0
        }
        
    tokens_new = clean_and_tokenize(text)
    if not tokens_new:
        return {
            "duplicate_ticket": False,
            "duplicate_ticket_id": None,
            "matched_ticket_id": None,
            "similarity_score": 0.0
        }

    # Fetch last 100 tickets to check
    existing_tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).limit(100).all()
    
    highest_score = 0.0
    duplicate_id = None
    
    for ticket in existing_tickets:
        # Check exact string match
        if ticket.raw_text.strip() == text.strip():
            highest_score = 1.0
            duplicate_id = ticket.ticket_id
            break
            
        tokens_old = clean_and_tokenize(ticket.raw_text)
        if not tokens_old:
            continue
            
        intersection = tokens_new.intersection(tokens_old)
        union = tokens_new.union(tokens_old)
        
        jaccard_score = len(intersection) / len(union) if union else 0.0
        
        if jaccard_score > highest_score:
            highest_score = jaccard_score
            duplicate_id = ticket.ticket_id
            
    from app.services.gemini_service import gemini_reason_duplicate
    
    if duplicate_id and highest_score > 0.3:
        matched_ticket = db.query(Ticket).filter(Ticket.ticket_id == duplicate_id).first()
        if matched_ticket:
            gemini_res = gemini_reason_duplicate(text, matched_ticket.raw_text, duplicate_id)
            is_dup = gemini_res["duplicate_ticket"]
            return {
                "duplicate_ticket": is_dup,
                "duplicate_ticket_id": duplicate_id if is_dup else None,
                "matched_ticket_id": duplicate_id if is_dup else None,
                "similarity_score": gemini_res["similarity_score"]
            }

    is_dup = highest_score >= SIMILARITY_THRESHOLD
    return {
        "duplicate_ticket": is_dup,
        "duplicate_ticket_id": duplicate_id if is_dup else None,
        "matched_ticket_id": duplicate_id if is_dup else None,
        "similarity_score": round(highest_score, 2)
    }


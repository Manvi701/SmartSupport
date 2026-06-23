import time
import random

def generate_unique_ticket_id() -> str:
    # Microsecond stamp + random offset ensures uniqueness in high-speed seeding loops
    t_usec = int(time.time() * 1000000)
    rand_part = random.randint(10, 99)
    tkt_hash = (t_usec + rand_part) % 100000
    return f"TKT-{time.strftime('%Y%m%d')}-{tkt_hash:05d}"

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.services.gemini_service import analyze_ticket
from app.services.language_detect import detect_language

from app.services.translate import translate_text
from app.services.profanity import filter_profanity
from app.services.intent import classify_intent
from app.services.sentiment import analyze_sentiment
from app.services.entity import extract_entities
from app.services.duplicate import detect_duplicate
from app.services.priority import determine_priority_local
from app.services.spam import detect_spam
from app.services.retry_helper import retry_on_failure, get_retry_stats

# Intent to Department routing map
INTENT_DEPARTMENT_MAP = {
    "Refund Request": "Finance",
    "Payment Issue": "Finance",
    "Order Delay": "Logistics",
    "Login Issue": "Technical Support",
    "Technical Bug": "Technical Support",
    "Security Issue": "Security Team",
    "Account Issue": "Customer Success",
    "Subscription Problem": "Customer Success",
    "Cancellation": "Customer Success",
    "Complaint": "Operations Team",
    "Feature Request": "Operations Team",
    "Spam": "Operations Team",
    "Out Of Scope": "Operations Team"
}

# -------------------------------------------------------------
# Wrapped Fault-Tolerant AI Pipelines with Fallbacks
# -------------------------------------------------------------
@retry_on_failure(max_retries=3, fallback_value={"language": "English", "confidence": 0.8})
def wrapped_detect_language(text: str):
    return detect_language(text)

@retry_on_failure(max_retries=3, fallback_value=lambda: {"translated_text": "[Fallback: Translation Unavailable]", "source_language": "English", "original_text": ""})
def wrapped_translate_text(text: str, lang: str):
    return translate_text(text, lang)

@retry_on_failure(max_retries=3, fallback_value=lambda: {"cleaned_text": "", "profanity_detected": False})
def wrapped_filter_profanity(text: str):
    # Returns raw text if cleaning bails
    return {"cleaned_text": text, "profanity_detected": False}

@retry_on_failure(max_retries=3, fallback_value={"intent": "Complaint", "confidence": 0.75})
def wrapped_classify_intent(text: str, translated_text: str):
    return classify_intent(text, translated_text)

@retry_on_failure(max_retries=3, fallback_value={"sentiment": "Neutral", "confidence": 0.8})
def wrapped_analyze_sentiment(text: str, translated_text: str):
    return analyze_sentiment(text, translated_text)

@retry_on_failure(max_retries=3, fallback_value={"order_id": "", "amount": "", "email": "", "phone": ""})
def wrapped_extract_entities(text: str, translated_text: str):
    return extract_entities(text, translated_text)

# -------------------------------------------------------------
# Main Orchestrator
# -------------------------------------------------------------
def run_triage_pipeline(text: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Executes the entire AI support triage pipeline.
    Bypasses heavy deep processing if Spam is detected.
    Integrates fault tolerance retry system for all AI endpoints.
    """
    timeline = {}
    start_pipeline = time.time()
    
    # Track retry telemetry for this ticket
    start_stats = get_retry_stats()
    
    # 0. Input Validation
    t0 = time.time()
    raw_text = text if text is not None else ""
    is_empty = not raw_text.strip()
    timeline["Validation"] = {"duration_ms": round((time.time() - t0) * 1000, 2), "status": "Empty Input" if is_empty else "Valid"}
    
    if is_empty:
        return create_empty_ticket_response(timeline)

    if not settings.MOCK_AI_MODE:
        # Search the database for duplicate candidate
        comp_text = None
        comp_id = None
        if db:
            from app.services.duplicate import clean_and_tokenize
            tokens_new = clean_and_tokenize(raw_text)
            if tokens_new:
                from app.models import Ticket
                existing_tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).limit(50).all()
                highest_score = 0.0
                best_id = None
                best_text = None
                for t in existing_tickets:
                    if t.raw_text.strip() == raw_text.strip():
                        highest_score = 1.0
                        best_id = t.ticket_id
                        best_text = t.raw_text
                        break
                    tokens_old = clean_and_tokenize(t.raw_text)
                    if tokens_old:
                        intersection = tokens_new.intersection(tokens_old)
                        union = tokens_new.union(tokens_old)
                        score = len(intersection) / len(union) if union else 0.0
                        if score > highest_score:
                            highest_score = score
                            best_id = t.ticket_id
                            best_text = t.raw_text
                if highest_score > 0.3:
                    comp_text = best_text
                    comp_id = best_id

        # Call Gemini central analyzer
        triage_res = analyze_ticket(raw_text, comp_text, comp_id)
        
        # Calculate timeline
        total_duration = round((time.time() - start_pipeline) * 1000, 2)
        timeline["Validation"] = {"duration_ms": 0.0, "status": "Valid"}
        timeline["Gemini AI Pipeline"] = {"duration_ms": total_duration, "result": "Complete"}
        timeline["total_duration_ms"] = total_duration
        
        priority = triage_res.get("priority", "Medium")
        sla_hours = 1 if priority == "Critical" else 4 if priority == "High" else 8 if priority == "Medium" else 24
        
        confidence_score = triage_res.get("confidence_score", 0.9)
        lang = triage_res.get("language", "English")
        duplicate_ticket = triage_res.get("duplicate_ticket", False)
        human_intervention = triage_res.get("human_intervention", "Can Be Resolved Online")
        
        human_review_required = (
            confidence_score < 0.85 or 
            priority == "Critical" or 
            "mixed" in lang.lower() or 
            duplicate_ticket or
            human_intervention == "Human Required"
        )
        
        return {
            "ticket_id": triage_res.get("ticket_id"),
            "summary": triage_res.get("summary"),
            "language": lang,
            "translated_text": triage_res.get("translated_text"),
            "cleaned_text": triage_res.get("cleaned_text"),
            "intent": triage_res.get("intent"),
            "sentiment": triage_res.get("sentiment"),
            "priority": priority,
            "department": triage_res.get("department"),
            "sla_hours": sla_hours,
            "confidence_score": confidence_score,
            "human_review_required": human_review_required,
            "out_of_scope": triage_res.get("intent") in ["Out Of Scope", "Spam"],
            "duplicate_ticket": duplicate_ticket,
            "duplicate_ticket_id": triage_res.get("duplicate_ticket_id"),
            "matched_ticket_id": triage_res.get("duplicate_ticket_id"),
            "spam": triage_res.get("spam", False),
            "spam_score": triage_res.get("spam_score", 0.0),
            "spam_reason": triage_res.get("spam_reason", ""),
            "retries_count": triage_res.get("retries_count", 0),
            "reason": triage_res.get("reason"),
            "human_intervention": human_intervention,
            "human_intervention_reason": triage_res.get("human_intervention_reason"),
            "entities": {
                "order_id": triage_res.get("entity_order_id", ""),
                "amount": triage_res.get("entity_amount", ""),
                "email": triage_res.get("entity_email", ""),
                "phone": triage_res.get("entity_phone", "")
            },
            "timeline_data": timeline
        }


    # 1. Spam Detection (Executed first to allow bypass shortcutting)
    t_spam = time.time()
    spam_result = detect_spam(raw_text)
    is_spam = spam_result["spam"]
    spam_score = spam_result["spam_score"]
    spam_reason = spam_result["reason"]
    timeline["Spam Filter"] = {"duration_ms": round((time.time() - t_spam) * 1000, 2), "result": "Spam Blocked" if is_spam else "Clean"}
    
    if is_spam:
        # Bypassed pipeline for spam tickets
        ticket_id = generate_unique_ticket_id()
        
        timeline["total_duration_ms"] = round((time.time() - start_pipeline) * 1000, 2)
        
        return {
            "ticket_id": ticket_id,
            "summary": f"Spam: {spam_reason}",
            "language": "English",
            "translated_text": raw_text,
            "cleaned_text": raw_text,
            "intent": "Spam",
            "sentiment": "Neutral",
            "priority": "Low",
            "department": "Operations Team",
            "sla_hours": 24,
            "confidence_score": spam_score,
            "human_review_required": False,
            "out_of_scope": True,
            "duplicate_ticket": False,
            "duplicate_ticket_id": None,
            "matched_ticket_id": None,
            "spam": True,
            "spam_score": spam_score,
            "spam_reason": spam_reason,
            "human_intervention": "Can Be Resolved Online",
            "human_intervention_reason": "Spam message auto-dismissed.",

            "retries_count": 0,
            "reason": f"Automatically dismissed by Spam Filter. Reason: {spam_reason}",
            "entities": {
                "order_id": "",
                "amount": "",
                "email": "",
                "phone": ""
            },
            "timeline_data": timeline
        }

    # 2. Language Detection (Fault tolerant)
    t1 = time.time()
    lang_result = wrapped_detect_language(raw_text)
    lang = lang_result["language"]
    lang_conf = lang_result["confidence"]
    timeline["Language Detection"] = {"duration_ms": round((time.time() - t1) * 1000, 2), "result": lang}
    
    # 3. Translation to English (Fault tolerant)
    t2 = time.time()
    trans_result = wrapped_translate_text(raw_text, lang)
    translated_text = trans_result["translated_text"]
    timeline["Translation"] = {"duration_ms": round((time.time() - t2) * 1000, 2), "result": "Done"}
    
    # 4. Profanity Detection & Cleaning (Fault tolerant)
    t3 = time.time()
    prof_result = wrapped_filter_profanity(raw_text)
    cleaned_text = prof_result["cleaned_text"]
    profanity_detected = prof_result["profanity_detected"]
    
    # Clean translated text if multilingual
    if lang.lower() != "english":
        trans_prof = wrapped_filter_profanity(translated_text)
        translated_text = trans_prof["cleaned_text"]
    timeline["Profanity Filtering"] = {"duration_ms": round((time.time() - t3) * 1000, 2), "result": "Cleaned" if profanity_detected else "No Profanity"}
    
    # 5. Intent Classification (Fault tolerant)
    t4 = time.time()
    intent_result = wrapped_classify_intent(raw_text, translated_text)
    intent = intent_result["intent"]
    intent_conf = intent_result["confidence"]
    timeline["Intent Classification"] = {"duration_ms": round((time.time() - t4) * 1000, 2), "result": intent}
    
    # 6. Sentiment Analysis (Fault tolerant)
    t5 = time.time()
    sent_result = wrapped_analyze_sentiment(raw_text, translated_text)
    sentiment = sent_result["sentiment"]
    sent_conf = sent_result["confidence"]
    timeline["Sentiment Analysis"] = {"duration_ms": round((time.time() - t5) * 1000, 2), "result": sentiment}
    
    # 7. Entity Extraction (Fault tolerant)
    t6 = time.time()
    entities = wrapped_extract_entities(raw_text, translated_text)
    timeline["Entity Extraction"] = {"duration_ms": round((time.time() - t6) * 1000, 2), "result": "Extracted"}
    
    # 8. Duplicate Ticket Detection
    t7 = time.time()
    duplicate_result = detect_duplicate(raw_text, db)
    duplicate_ticket = duplicate_result["duplicate_ticket"]
    duplicate_ticket_id = duplicate_result["duplicate_ticket_id"]
    matched_ticket_id = duplicate_result["matched_ticket_id"]
    similarity_score = duplicate_result["similarity_score"]
    timeline["Duplicate Detection"] = {"duration_ms": round((time.time() - t7) * 1000, 2), "result": f"Score: {similarity_score}"}
    
    # 9. Priority Prediction
    t8 = time.time()
    priority_result = determine_priority_local(intent, sentiment, profanity_detected, translated_text)
    priority = priority_result["priority"]
    sla_hours = priority_result["sla_hours"]
    priority_reason = priority_result["reason"]
    timeline["Priority Engine"] = {"duration_ms": round((time.time() - t8) * 1000, 2), "result": priority}
    
    # 10. AI Triage Decision & Routing
    t9 = time.time()
    department = INTENT_DEPARTMENT_MAP.get(intent, "Operations Team")
    out_of_scope = (intent == "Out Of Scope" or intent == "Spam")
    
    # Average confidence
    confidence_score = round((lang_conf + intent_conf + sent_conf) / 3.0, 2)
    
    # Human review conditions
    human_review_required = False
    review_reasons = []
    if confidence_score < 0.85:
        human_review_required = True
        review_reasons.append("Low AI confidence score.")
    if profanity_detected:
        human_review_required = True
        review_reasons.append("Profanity/offensive language detected.")
    if priority == "Critical":
        human_review_required = True
        review_reasons.append("Critical priority escalations require supervisor review.")
    if "mixed" in lang.lower():
        human_review_required = True
        review_reasons.append(f"Mixed language ticket ({lang}) translation audit.")
    if duplicate_ticket:
        human_review_required = True
        review_reasons.append(f"Duplicate of ticket {duplicate_ticket_id} ({int(similarity_score*100)}% match).")
        
    reason = "Human Review: " + " | ".join(review_reasons) if human_review_required else f"Automated routing clear. Routed to {department}."
    
    timeline["Triage Decision"] = {"duration_ms": round((time.time() - t9) * 1000, 2), "result": department}
    timeline["total_duration_ms"] = round((time.time() - start_pipeline) * 1000, 2)
    
    # Calculate exact retries occurred during this ticket run
    end_stats = get_retry_stats()
    retries_count = end_stats["attempts"] - start_stats["attempts"]

    summary_words = translated_text.split()
    summary = " ".join(summary_words[:12]) + ("..." if len(summary_words) > 12 else "")
    if not summary:
        summary = "No content available."

    ticket_id = generate_unique_ticket_id()
    
    return {
        "ticket_id": ticket_id,
        "summary": summary,
        "language": lang,
        "translated_text": translated_text,
        "cleaned_text": cleaned_text,
        "intent": intent,
        "sentiment": sentiment,
        "priority": priority,
        "department": department,
        "sla_hours": sla_hours,
        "confidence_score": confidence_score,
        "human_review_required": human_review_required,
        "out_of_scope": out_of_scope,
        "duplicate_ticket": duplicate_ticket,
        "duplicate_ticket_id": duplicate_ticket_id,
        "matched_ticket_id": matched_ticket_id,
        "spam": False,
        "spam_score": spam_score,
        "spam_reason": spam_reason,
        "human_intervention": "Human Required" if human_review_required else "Can Be Resolved Online",
        "human_intervention_reason": "Rule-based mock evaluation.",

        "retries_count": retries_count,
        "reason": reason,
        "entities": entities,
        "timeline_data": timeline
    }

def create_empty_ticket_response(timeline: Dict[str, Any]) -> Dict[str, Any]:
    """
    Builds the default fallback response for empty support tickets.
    """
    ticket_id = generate_unique_ticket_id()
    
    timeline["total_duration_ms"] = sum(v.get("duration_ms", 0.0) for v in timeline.values() if isinstance(v, dict))
    
    return {
        "ticket_id": ticket_id,
        "summary": "Empty customer input.",
        "language": "English",
        "translated_text": "",
        "cleaned_text": "",
        "intent": "Out Of Scope",
        "sentiment": "Neutral",
        "priority": "Low",
        "department": "Operations Team",
        "sla_hours": 24,
        "confidence_score": 1.0,
        "human_review_required": True,
        "out_of_scope": True,
        "duplicate_ticket": False,
        "duplicate_ticket_id": None,
        "matched_ticket_id": None,
        "spam": False,
        "spam_score": 0.0,
        "spam_reason": "No content",
        "human_intervention": "Human Required",
        "human_intervention_reason": "Empty support input.",

        "retries_count": 0,
        "reason": "Empty string submitted. Flagged as out of scope, human review required to close.",
        "entities": {
            "order_id": "",
            "amount": "",
            "email": "",
            "phone": ""
        },
        "timeline_data": timeline
    }

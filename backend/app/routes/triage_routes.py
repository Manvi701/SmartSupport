from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas import (
    TriageRequest,
    StepAnalysisRequest,
    LanguageDetectResponse,
    TranslateResponse,
    ProfanityFilterResponse,
    IntentClassificationResponse,
    SentimentAnalysisResponse,
    EntityExtractionResponse,
    DuplicateDetectionResponse,
    PriorityEngineResponse,
    TriageDecisionResponse,
    TicketResponse
)
from app.services.language_detect import detect_language
from app.services.translate import translate_text
from app.services.profanity import filter_profanity
from app.services.intent import classify_intent
from app.services.sentiment import analyze_sentiment
from app.services.entity import extract_entities
from app.services.duplicate import detect_duplicate
from app.services.priority import determine_priority, determine_priority_local
from app.services.triage import run_triage_pipeline, INTENT_DEPARTMENT_MAP
from app.services.spam import detect_spam
from app.models import Ticket

router = APIRouter(prefix="/api", tags=["Triage Pipeline"])

@router.post("/spam-detect")
def api_spam_detect(payload: TriageRequest = Body(...)):
    res = detect_spam(payload.text)
    return {
        "spam": res["spam"],
        "spam_score": res["spam_score"],
        "reason": res["reason"]
    }

@router.post("/language-detect", response_model=LanguageDetectResponse)
def api_language_detect(payload: TriageRequest = Body(...)):
    res = detect_language(payload.text)
    return LanguageDetectResponse(language=res["language"], confidence=res["confidence"])

@router.post("/translate", response_model=TranslateResponse)
def api_translate(payload: TriageRequest = Body(...), source_lang: str = "auto"):
    if source_lang == "auto":
        lang_res = detect_language(payload.text)
        source_lang = lang_res["language"]
    res = translate_text(payload.text, source_lang)
    return TranslateResponse(
        original_text=payload.text,
        translated_text=res["translated_text"],
        source_language=source_lang
    )

@router.post("/profanity-filter", response_model=ProfanityFilterResponse)
def api_profanity_filter(payload: TriageRequest = Body(...)):
    res = filter_profanity(payload.text)
    return ProfanityFilterResponse(
        original_text=payload.text,
        cleaned_text=res["cleaned_text"],
        profanity_detected=res["profanity_detected"]
    )

@router.post("/intent-classification", response_model=IntentClassificationResponse)
def api_intent_classification(payload: StepAnalysisRequest = Body(...)):
    translated_text = payload.translated_text
    if not translated_text:
        lang_res = detect_language(payload.text)
        trans_res = translate_text(payload.text, lang_res["language"])
        translated_text = trans_res["translated_text"]
        
    res = classify_intent(payload.text, translated_text)
    return IntentClassificationResponse(intent=res["intent"], confidence=res["confidence"])

@router.post("/sentiment-analysis", response_model=SentimentAnalysisResponse)
def api_sentiment_analysis(payload: StepAnalysisRequest = Body(...)):
    translated_text = payload.translated_text
    if not translated_text:
        lang_res = detect_language(payload.text)
        trans_res = translate_text(payload.text, lang_res["language"])
        translated_text = trans_res["translated_text"]
        
    res = analyze_sentiment(payload.text, translated_text)
    return SentimentAnalysisResponse(sentiment=res["sentiment"], confidence=res["confidence"])

@router.post("/entity-extraction", response_model=EntityExtractionResponse)
def api_entity_extraction(payload: StepAnalysisRequest = Body(...)):
    translated_text = payload.translated_text
    if not translated_text:
        lang_res = detect_language(payload.text)
        trans_res = translate_text(payload.text, lang_res["language"])
        translated_text = trans_res["translated_text"]
        
    res = extract_entities(payload.text, translated_text)
    return EntityExtractionResponse(entities=res)

@router.post("/duplicate-detection", response_model=DuplicateDetectionResponse)
def api_duplicate_detection(payload: TriageRequest = Body(...), db: Session = Depends(get_db)):
    res = detect_duplicate(payload.text, db)
    return DuplicateDetectionResponse(
        duplicate_ticket=res["duplicate_ticket"],
        duplicate_ticket_id=res["duplicate_ticket_id"],
        similarity_score=res["similarity_score"]
    )

@router.post("/priority-engine", response_model=PriorityEngineResponse)
def api_priority_engine(
    intent: str = Body(...),
    sentiment: str = Body(...),
    profanity_detected: bool = Body(...),
    translated_text: str = Body("")
):
    res = determine_priority(intent, sentiment, profanity_detected, translated_text)
    return PriorityEngineResponse(
        priority=res["priority"],
        sla_hours=res["sla_hours"],
        reason=res["reason"]
    )


@router.post("/triage-decision", response_model=TriageDecisionResponse)
def api_triage_decision(
    intent: str = Body(...),
    confidence_score: float = Body(...),
    profanity_detected: bool = Body(...),
    language: str = Body(...),
    priority: str = Body(...),
    duplicate_ticket: bool = Body(False)
):
    department = INTENT_DEPARTMENT_MAP.get(intent, "Operations Team")
    out_of_scope = (intent == "Out Of Scope" or intent == "Spam")
    
    from app.services.gemini_service import gemini_human_intervention
    intervention_res = gemini_human_intervention(
        text="", 
        intent=intent, 
        confidence=confidence_score, 
        priority=priority
    )
    human_intervention = intervention_res["human_intervention"]
    human_intervention_reason = intervention_res["human_intervention_reason"]
    
    # Simple logic
    human_review_required = False
    reasons = []
    if confidence_score < 0.85:
        human_review_required = True
        reasons.append("Low AI confidence score.")
    if profanity_detected:
        human_review_required = True
        reasons.append("Profanity/offensive language detected.")
    if priority == "Critical":
        human_review_required = True
        reasons.append("Critical priority escalations require supervisor review.")
    if language.lower() in ["hindi", "gujarati", "mixed"]:
        human_review_required = True
        reasons.append(f"Multilingual ticket ({language}) translation verification.")
    if duplicate_ticket:
        human_review_required = True
        reasons.append("Potential duplicate ticket.")
    if human_intervention == "Human Required":
        human_review_required = True
        reasons.append("Human intervention required for this query category.")
        
    reason = "Human review triggered: " + " | ".join(reasons) if human_review_required else f"Automated routing clear. Routed to {department}."
    
    return TriageDecisionResponse(
        department=department,
        human_review_required=human_review_required,
        out_of_scope=out_of_scope,
        reason=reason,
        human_intervention=human_intervention,
        human_intervention_reason=human_intervention_reason
    )


@router.post("/triage", response_model=TicketResponse)
def run_triage_full(payload: TriageRequest = Body(...), db: Session = Depends(get_db)):
    """
    Executes the entire workflow, stores the ticket in the database, and returns the result.
    """
    try:
        triage_res = run_triage_pipeline(payload.text, db)
        
        # Save to database
        db_ticket = Ticket(
            ticket_id=triage_res["ticket_id"],
            raw_text=payload.text,
            summary=triage_res["summary"],
            language=triage_res["language"],
            translated_text=triage_res["translated_text"],
            cleaned_text=triage_res["cleaned_text"],
            intent=triage_res["intent"],
            sentiment=triage_res["sentiment"],
            priority=triage_res["priority"],
            department=triage_res["department"],
            sla_hours=triage_res["sla_hours"],
            confidence_score=triage_res["confidence_score"],
            human_review_required=triage_res["human_review_required"],
            out_of_scope=triage_res["out_of_scope"],
            duplicate_ticket=triage_res["duplicate_ticket"],
            duplicate_ticket_id=triage_res["duplicate_ticket_id"],
            matched_ticket_id=triage_res["matched_ticket_id"],
            spam=triage_res["spam"],
            spam_score=triage_res["spam_score"],
            spam_reason=triage_res["spam_reason"],
            retries_count=triage_res["retries_count"],
            reason=triage_res["reason"],
            entity_order_id=triage_res["entities"]["order_id"],
            entity_amount=triage_res["entities"]["amount"],
            entity_email=triage_res["entities"]["email"],
            entity_phone=triage_res["entities"]["phone"],
            human_intervention=triage_res["human_intervention"],
            human_intervention_reason=triage_res["human_intervention_reason"],
            status="Open",
            timeline_data=triage_res["timeline_data"]
        )

        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        
        # Format entities back to nested dictionary for schema response
        return TicketResponse.model_validate({
            **db_ticket.__dict__,
            "entities": {
                "order_id": db_ticket.entity_order_id or "",
                "amount": db_ticket.entity_amount or "",
                "email": db_ticket.entity_email or "",
                "phone": db_ticket.entity_phone or ""
            }
        })
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Triage pipeline failed: {str(e)}")

import time
import logging
import random
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import settings


logger = logging.getLogger("smart_triage")

# -------------------------------------------------------------
# Pydantic Schemas for Gemini Structured Outputs
# -------------------------------------------------------------
class GeminiTriageResponse(BaseModel):
    ticket_id: str = Field(description="Generated unique ticket ID (format: TKT-YYYYMMDD-XXXXX)")
    summary: str = Field(description="A concise 1-sentence summary of the ticket in English")
    language: str = Field(description="Detected language, must be: English, Hindi, Gujarati, Mixed Hindi-English, Mixed Gujarati-English, Mixed Hindi-Gujarati-English")
    translated_text: str = Field(description="Full English translation of the raw ticket")
    cleaned_text: str = Field(description="Raw text with any profanities masked by asterisks")
    intent: str = Field(description="Classified intent, must be one of the 13: Refund Request, Payment Issue, Order Delay, Login Issue, Technical Bug, Security Issue, Account Issue, Subscription Problem, Cancellation, Complaint, Feature Request, Spam, Out Of Scope")
    sentiment: str = Field(description="Classified sentiment, must be: Positive, Neutral, Negative")
    priority: str = Field(description="Calculated priority: Critical, High, Medium, Low")
    department: str = Field(description="Routed department: Finance, Logistics, Technical Support, Security Team, Customer Success, Operations Team")
    confidence_score: float = Field(description="AI classification confidence score between 0.0 and 1.0")
    reason: str = Field(description="Explainable AI reasoning explaining why the priority, intent, and department were chosen")
    spam: bool = Field(description="True if the message is spam (gibberish, repeated words, ads), else False")
    spam_score: float = Field(description="Spam probability score between 0.0 and 1.0")
    spam_reason: str = Field(description="Reason for spam designation (or empty string if clean)")
    entity_order_id: str = Field(default="", description="Extracted order ID (e.g. ORD-XXXXX), if any")
    entity_amount: str = Field(default="", description="Extracted payment/currency amount, if any")
    entity_email: str = Field(default="", description="Extracted customer email address, if any")
    entity_phone: str = Field(default="", description="Extracted customer phone number, if any")
    duplicate_ticket: bool = Field(description="True if the ticket is a duplicate of the comparison ticket, else False")
    duplicate_ticket_id: Optional[str] = Field(default=None, description="The ID of the compared duplicate ticket if duplicate_ticket is True")
    similarity_score: float = Field(description="Jaccard or semantic similarity score (0.0 to 1.0) with the comparison ticket")
    human_intervention: str = Field(description="Classification: 'Human Required' or 'Can Be Resolved Online'")
    human_intervention_reason: str = Field(description="Explanation of the human intervention routing decision")

class LanguageAnalysis(BaseModel):
    language: str
    confidence: float

class TranslationAnalysis(BaseModel):
    translated_text: str

class IntentAnalysis(BaseModel):
    intent: str
    confidence: float

class SentimentAnalysis(BaseModel):
    sentiment: str
    confidence: float

class EntityAnalysis(BaseModel):
    order_id: str
    amount: str
    email: str
    phone: str

class PriorityAnalysis(BaseModel):
    priority: str
    sla_hours: int
    reason: str

class DuplicateAnalysis(BaseModel):
    duplicate_ticket: bool
    similarity_score: float
    reasoning: str

class HumanInterventionAnalysis(BaseModel):
    human_intervention: str
    reason: str

# -------------------------------------------------------------
# Initialize Gemini Client
# -------------------------------------------------------------
client = None
if settings.GEMINI_API_KEY and not settings.MOCK_AI_MODE:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google Gemini API client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API client: {e}. Falling back to mock mode.")
else:
    logger.warning("No GEMINI_API_KEY provided or MOCK_AI_MODE is active. Operating in fallback mode.")

# -------------------------------------------------------------
# Retry Wrapper Helper
# -------------------------------------------------------------
def call_gemini_with_retry(prompt: str, response_schema: Any, system_instruction: Optional[str] = None) -> Optional[Any]:
    """
    Calls the Gemini API with a Pydantic response schema.
    Retries up to 3 times on exception with exponential backoff.
    """
    if not client:
        return None

    for attempt in range(3):
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.1,
            )
            if system_instruction:
                config.system_instruction = system_instruction
                
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            
            # The SDK automatically returns the parsed Pydantic object in response.parsed
            if response.parsed:
                return response.parsed
                
            # If parsing failed or wasn't populated, log and retry
            logger.warning(f"Gemini returned empty parsed response on attempt {attempt + 1}")
        except Exception as e:
            logger.error(f"Gemini API failure on attempt {attempt + 1}: {e}")
            if attempt < 2:
                time.sleep(2 ** attempt) # Backoff sleep
                
    return None

# -------------------------------------------------------------
# Local Fallback Rule-Based Generator
# -------------------------------------------------------------
def run_local_heuristics_fallback(text: str, comparison_text: Optional[str] = None, comparison_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a complete, schema-compliant dictionary using local heuristic services.
    Ensures the application never crashes even if the internet or API is down.
    """
    from app.services.language_detect import detect_language_local
    from app.services.translate import translate_text
    from app.services.profanity import filter_profanity
    from app.services.intent import classify_intent_local
    from app.services.sentiment import analyze_sentiment_local
    from app.services.entity import extract_entities_local
    from app.services.priority import determine_priority_local
    from app.services.spam import detect_spam

    logger.info("Executing local heuristics fallback triage.")

    
    # 0. Generate Unique ID
    t_usec = int(time.time() * 1000000)
    rand_part = random.randint(10, 99)
    tkt_hash = (t_usec + rand_part) % 100000
    ticket_id = f"TKT-{time.strftime('%Y%m%d')}-{tkt_hash:05d}"

    # 1. Spam check
    spam_res = detect_spam(text)
    
    # 2. Language check
    lang_res = detect_language_local(text)
    lang = lang_res["language"]
    
    # 3. Translation
    trans_res = translate_text(text, lang)
    translated_text = trans_res["translated_text"]
    
    # 4. Profanity check
    prof_res = filter_profanity(text)
    cleaned_text = prof_res["cleaned_text"]
    prof_detected = prof_res["profanity_detected"]
    
    # 5. Intent check
    intent_res = classify_intent_local(translated_text)
    intent = intent_res["intent"]
    
    # 6. Sentiment check
    sentiment_res = analyze_sentiment_local(translated_text)
    sentiment = sentiment_res["sentiment"]
    
    # 7. Entity Extraction
    entities = extract_entities_local(text, translated_text)
    
    # 8. Priority check
    priority_res = determine_priority_local(intent, sentiment, prof_detected, translated_text)
    priority = priority_res["priority"]
    
    # 9. Routing
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
    department = INTENT_DEPARTMENT_MAP.get(intent, "Operations Team")
    
    # 10. Duplicate Reasoning (Simple local check)
    is_dup = False
    sim_score = 0.0
    if comparison_text:
        # Check if identical strings
        if text.strip() == comparison_text.strip():
            is_dup = True
            sim_score = 1.0
            
    # 11. Human Intervention Rules
    # Human Required: Account hacked, Fraud, Legal complaints, Escalations, Very low confidence predictions, Critical security issues.
    # Can Be Resolved Online: Order tracking, Password reset, Refund status, Invoice requests, Feature requests, Delivery updates.
    human_required_intents = ["Security Issue", "Cancellation", "Complaint"]
    human_required_keywords = ["fraud", "legal", "lawyer", "police", "court", "hack", "compromise", "stolen", "unauthorized"]
    
    is_human_required = (
        intent in human_required_intents or
        priority == "Critical" or
        any(word in translated_text.lower() for word in human_required_keywords)
    )
    
    human_intervention = "Human Required" if is_human_required else "Can Be Resolved Online"
    intervention_reason = (
        "Potential security breach or high priority escalation detected" 
        if is_human_required 
        else "Routine customer query. Standard self-service resolution path available."
    )
    
    reason = f"Heuristics decision: Routed {intent} query to {department}. Priority: {priority}."
    
    return {
        "ticket_id": ticket_id,
        "summary": (translated_text[:60] + "...") if len(translated_text) > 60 else translated_text,
        "language": lang,
        "translated_text": translated_text,
        "cleaned_text": cleaned_text,
        "intent": intent,
        "sentiment": sentiment,
        "priority": priority,
        "department": department,
        "confidence_score": 0.85,
        "reason": reason,
        "spam": spam_res["spam"],
        "spam_score": spam_res["spam_score"],
        "spam_reason": spam_res["reason"],
        "entity_order_id": entities["order_id"],
        "entity_amount": entities["amount"],
        "entity_email": entities["email"],
        "entity_phone": entities["phone"],
        "duplicate_ticket": is_dup,
        "duplicate_ticket_id": comparison_id if is_dup else None,
        "similarity_score": sim_score,
        "human_intervention": human_intervention,
        "human_intervention_reason": intervention_reason
    }

# -------------------------------------------------------------
# Unified Full Analysis Endpoint
# -------------------------------------------------------------
def analyze_ticket(text: str, comparison_ticket_text: Optional[str] = None, comparison_ticket_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes a support ticket using Gemini to run the full pipeline in one single model call.
    Falls back to local rules-based heuristics if Gemini bails out.
    """
    if not text or not text.strip():
        # Empty input handling
        fallback = run_local_heuristics_fallback("")
        fallback["summary"] = "Empty support request."
        return fallback

    if client:
        comp_context = ""
        if comparison_ticket_text:
            comp_context = f"\nComparison ticket (ID: {comparison_ticket_id or 'T000'}):\n{comparison_ticket_text}"
            
        system_instruction = (
            "You are the central analysis intelligence engine for an enterprise customer support queue. "
            "Your job is to read raw tickets (possibly multilingual, unstructured, containing spelling errors) "
            "and output a structured triage record. Return strict JSON matching the schema details."
        )
        
        prompt = f"""
        Analyze the raw customer support ticket below.
        
        Raw Ticket Text:
        \"\"\"{text}\"\"\"
        {comp_context}
        
        Instructions:
        1. ticket_id: Generate a unique ID (e.g. TKT-20260623-12485).
        2. summary: A clean, 1-sentence English summary of the user's issue.
        3. language: Detect language. Choose from: English, Hindi, Gujarati, Mixed Hindi-English, Mixed Gujarati-English, Mixed Hindi-Gujarati-English.
        4. translated_text: Translate the raw text into English. If already English, copy original.
        5. cleaned_text: Replace any profanities, abuses, or insults in the raw text with asterisks.
        6. intent: Map to exactly one category: Refund Request, Payment Issue, Order Delay, Login Issue, Technical Bug, Security Issue, Account Issue, Subscription Problem, Cancellation, Complaint, Feature Request, Spam, Out Of Scope.
        7. sentiment: Choose: Positive, Neutral, Negative.
        8. priority: Choose: Critical, High, Medium, Low.
        9. department: Choose: Finance, Logistics, Technical Support, Security Team, Customer Success, Operations Team.
        10. confidence_score: Float between 0.0 and 1.0 indicating AI confidence.
        11. reason: Provide a detailed explainable AI paragraph explaining your classifications.
        12. spam: Mark True if this is advertising spam, junk, repetitive words, or gibberish.
        13. spam_score: Float spam score (0.0 to 1.0).
        14. spam_reason: If spam, why? If clean, empty string.
        15. entity_order_id: Extract any order id starting with ORD- or similar (e.g. ORD-12345).
        16. entity_amount: Extract payment value mentioned.
        17. entity_email: Extract customer email.
        18. entity_phone: Extract customer phone.
        19. duplicate_ticket: If a comparison ticket is provided, determine if they represent the same underlying issue.
        20. duplicate_ticket_id: Set to the ID of the comparison ticket if duplicate_ticket is True.
        21. similarity_score: Similarity score (0.0 to 1.0) with comparison ticket.
        22. human_intervention: Classify as 'Human Required' or 'Can Be Resolved Online'.
            Follow these rules:
            - 'Human Required': Account hacked, Fraud, Legal complaints, Escalations, Very low confidence predictions (<0.7), Critical security issues.
            - 'Can Be Resolved Online': Order tracking, Password reset, Refund status, Invoice requests, Feature requests, Delivery updates.
        23. human_intervention_reason: Detail why the human intervention routing is required or can be resolved online.
        """
        
        res = call_gemini_with_retry(prompt, GeminiTriageResponse, system_instruction)
        if res:
            # Map Pydantic response directly to dict
            return res.model_dump()
            
    # If client initialization or calls fail, go to local heuristics fallback
    return run_local_heuristics_fallback(text, comparison_ticket_text, comparison_ticket_id)

# -------------------------------------------------------------
# Modular Step Helpers for Visualizer UI Endpoints
# -------------------------------------------------------------
def gemini_detect_language(text: str) -> Dict[str, Any]:
    if client:
        prompt = f"Detect the language of this text. Choose from: English, Hindi, Gujarati, Mixed Hindi-English, Mixed Gujarati-English, Mixed Hindi-Gujarati-English. Text:\n{text}"
        res = call_gemini_with_retry(prompt, LanguageAnalysis)
        if res:
            return {"language": res.language, "confidence": res.confidence}
    from app.services.language_detect import detect_language_local
    return detect_language_local(text)


def gemini_translate(text: str, source_lang: str) -> Dict[str, Any]:
    if client:
        prompt = f"Translate this support ticket to English from {source_lang}. If already English, return as is. Text:\n{text}"
        res = call_gemini_with_retry(prompt, TranslationAnalysis)
        if res:
            return {"translated_text": res.translated_text}
    from app.services.translate import translate_local
    return {"translated_text": translate_local(text, source_lang)["translated_text"]}

def gemini_classify_intent(text: str, translated: str) -> Dict[str, Any]:
    if client:
        prompt = f"Classify the intent of this customer ticket: Raw text: '{text}', Translated text: '{translated}'. Choose from: Refund Request, Payment Issue, Order Delay, Login Issue, Technical Bug, Security Issue, Account Issue, Subscription Problem, Cancellation, Complaint, Feature Request, Spam, Out Of Scope."
        res = call_gemini_with_retry(prompt, IntentAnalysis)
        if res:
            return {"intent": res.intent, "confidence": res.confidence}
    from app.services.intent import classify_intent_local
    return classify_intent_local(translated)

def gemini_analyze_sentiment(text: str, translated: str) -> Dict[str, Any]:
    if client:
        prompt = f"Analyze the sentiment of this customer ticket: Raw text: '{text}', Translated text: '{translated}'. Choose from: Positive, Neutral, Negative."
        res = call_gemini_with_retry(prompt, SentimentAnalysis)
        if res:
            return {"sentiment": res.sentiment, "confidence": res.confidence}
    from app.services.sentiment import analyze_sentiment_local
    return analyze_sentiment_local(translated)

def gemini_extract_entities(text: str, translated: str) -> Dict[str, Any]:
    if client:
        prompt = f"Extract email, phone, order id (ORD-XXXXX), and amount from this ticket. Raw text: '{text}', Translated text: '{translated}'."
        res = call_gemini_with_retry(prompt, EntityAnalysis)
        if res:
            return {
                "order_id": res.order_id,
                "amount": res.amount,
                "email": res.email,
                "phone": res.phone
            }
    from app.services.entity import extract_entities_local
    return extract_entities_local(text, translated)

def gemini_determine_priority(intent: str, sentiment: str, profanity: bool, translated: str) -> Dict[str, Any]:
    if client:
        prompt = f"Determine the priority (Critical, High, Medium, Low) for this support ticket based on: Intent='{intent}', Sentiment='{sentiment}', ProfanityDetected={profanity}, Content='{translated}'."
        res = call_gemini_with_retry(prompt, PriorityAnalysis)
        if res:
            return {
                "priority": res.priority,
                "sla_hours": res.sla_hours,
                "reason": res.reason
            }
    from app.services.priority import determine_priority_local
    return determine_priority_local(intent, sentiment, profanity, translated)

def gemini_reason_duplicate(text: str, matched_text: str, matched_id: str) -> Dict[str, Any]:
    if client:
        prompt = f"Check if the ticket text is a duplicate of the matched ticket. Raw text: '{text}'. Matched text: '{matched_text}'. Matched ID: '{matched_id}'."
        res = call_gemini_with_retry(prompt, DuplicateAnalysis)
        if res:
            return {
                "duplicate_ticket": res.duplicate_ticket,
                "similarity_score": res.similarity_score,
                "reasoning": res.reasoning
            }
    return {
        "duplicate_ticket": text.strip() == matched_text.strip(),
        "similarity_score": 1.0 if text.strip() == matched_text.strip() else 0.0,
        "reasoning": "Determined by string matching."
    }

def gemini_human_intervention(text: str, intent: str, confidence: float, priority: str) -> Dict[str, Any]:
    if client:
        prompt = f"Determine if human intervention is required for this ticket based on rules: Raw text: '{text}', Intent: '{intent}', Confidence: {confidence}, Priority: '{priority}'."
        res = call_gemini_with_retry(prompt, HumanInterventionAnalysis)
        if res:
            return {
                "human_intervention": res.human_intervention,
                "human_intervention_reason": res.reason
            }
    # Local fallback logic
    is_human = (intent in ["Security Issue", "Cancellation", "Complaint"] or priority == "Critical" or confidence < 0.7)
    return {
        "human_intervention": "Human Required" if is_human else "Can Be Resolved Online",
        "human_intervention_reason": "Rule-based fallback check."
    }

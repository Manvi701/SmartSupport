from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

# Input Schema for raw analysis
class TriageRequest(BaseModel):
    text: str = Field(..., description="Raw customer message to triage")

class StepAnalysisRequest(BaseModel):
    text: str = Field(..., description="Raw customer message to analyze")
    translated_text: Optional[str] = Field(None, description="Pre-translated English text")

class BulkTriageRequest(BaseModel):
    tickets: List[TriageRequest]

# Nested Entities schema
class EntitiesSchema(BaseModel):
    order_id: Optional[str] = ""
    amount: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""

# Output Schema matching user requirements
class TriageOutputSchema(BaseModel):
    ticket_id: str
    summary: str
    language: str
    translated_text: str
    cleaned_text: str
    intent: str
    sentiment: str
    priority: str
    department: str
    sla_hours: int
    confidence_score: float
    human_review_required: bool
    out_of_scope: bool
    duplicate_ticket: bool
    duplicate_ticket_id: Optional[str] = None
    matched_ticket_id: Optional[str] = None
    spam: bool = False
    spam_score: float = 0.0
    spam_reason: Optional[str] = ""
    retries_count: int = 0
    reason: str
    human_intervention: str = "Can Be Resolved Online"
    human_intervention_reason: Optional[str] = ""
    entities: EntitiesSchema


# Database representation of Ticket
class TicketResponse(BaseModel):
    id: int
    ticket_id: str
    raw_text: str
    summary: Optional[str] = ""
    language: Optional[str] = ""
    translated_text: Optional[str] = ""
    cleaned_text: Optional[str] = ""
    intent: Optional[str] = ""
    sentiment: Optional[str] = ""
    priority: Optional[str] = ""
    department: Optional[str] = ""
    sla_hours: int
    confidence_score: float
    human_review_required: bool
    out_of_scope: bool
    duplicate_ticket: bool
    duplicate_ticket_id: Optional[str] = None
    matched_ticket_id: Optional[str] = None
    spam: bool = False
    spam_score: float = 0.0
    spam_reason: Optional[str] = ""
    retries_count: int = 0
    reason: Optional[str] = ""
    human_intervention: Optional[str] = "Can Be Resolved Online"
    human_intervention_reason: Optional[str] = ""
    entities: EntitiesSchema
    status: str
    created_at: datetime
    timeline_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Individual pipeline step schema responses
class LanguageDetectResponse(BaseModel):
    language: str
    confidence: float

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str

class ProfanityFilterResponse(BaseModel):
    original_text: str
    cleaned_text: str
    profanity_detected: bool

class IntentClassificationResponse(BaseModel):
    intent: str
    confidence: float

class SentimentAnalysisResponse(BaseModel):
    sentiment: str
    confidence: float

class EntityExtractionResponse(BaseModel):
    entities: EntitiesSchema

class DuplicateDetectionResponse(BaseModel):
    duplicate_ticket: bool
    duplicate_ticket_id: Optional[str] = None
    similarity_score: float

class PriorityEngineResponse(BaseModel):
    priority: str
    sla_hours: int
    reason: str

class TriageDecisionResponse(BaseModel):
    department: str
    human_review_required: bool
    out_of_scope: bool
    reason: str
    human_intervention: Optional[str] = "Can Be Resolved Online"
    human_intervention_reason: Optional[str] = ""


# Dashboard Analytics response
class MetricCard(BaseModel):
    total: int
    change: Optional[float] = 0.0  # Percentage change if any

class DashboardAnalytics(BaseModel):
    total_tickets: int
    critical_tickets: int
    open_tickets: int
    closed_tickets: int
    sentiment_breakdown: Dict[str, int]
    intent_distribution: Dict[str, int]
    language_distribution: Dict[str, int]
    department_workload: Dict[str, int]
    priority_distribution: Dict[str, int]
    human_intervention_required_count: int = 0
    human_intervention_required_percentage: float = 0.0


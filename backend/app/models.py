import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, JSON
from app.db import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True, nullable=False)
    raw_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    language = Column(String(50), nullable=True)
    translated_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)
    intent = Column(String(50), nullable=True)
    sentiment = Column(String(50), nullable=True)
    priority = Column(String(50), nullable=True)
    department = Column(String(50), nullable=True)
    sla_hours = Column(Integer, default=4)
    confidence_score = Column(Float, default=1.0)
    human_review_required = Column(Boolean, default=False)
    out_of_scope = Column(Boolean, default=False)
    duplicate_ticket = Column(Boolean, default=False)
    duplicate_ticket_id = Column(String(50), nullable=True) # Reference to duplicate ticket_id
    matched_ticket_id = Column(String(50), nullable=True) # Ref to original duplicate ticket_id
    spam = Column(Boolean, default=False)
    spam_score = Column(Float, default=0.0)
    spam_reason = Column(String(255), nullable=True)
    retries_count = Column(Integer, default=0)
    reason = Column(Text, nullable=True)
    
    # Entities flat columns
    entity_order_id = Column(String(100), nullable=True)
    entity_amount = Column(String(100), nullable=True)
    entity_email = Column(String(255), nullable=True)
    entity_phone = Column(String(100), nullable=True)

    # Human Intervention classification
    human_intervention = Column(String(50), default="Can Be Resolved Online")
    human_intervention_reason = Column(String(255), nullable=True)


    # Metadata & Workflow Tracking
    status = Column(String(50), default="Open")  # Open, Closed, In Progress
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    timeline_data = Column(JSON, nullable=True)  # Timestamps & durations of each pipeline step

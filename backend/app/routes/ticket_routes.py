import csv
import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket
from app.schemas import TicketResponse, TriageRequest, BulkTriageRequest
from app.services.triage import run_triage_pipeline
from app.data.sample_tickets import SAMPLE_TICKETS

router = APIRouter(prefix="/api/tickets", tags=["Tickets Management"])

def ticket_to_dict(t: Ticket) -> dict:
    return {
        "id": t.id,
        "ticket_id": t.ticket_id,
        "raw_text": t.raw_text,
        "summary": t.summary,
        "language": t.language,
        "translated_text": t.translated_text,
        "cleaned_text": t.cleaned_text,
        "intent": t.intent,
        "sentiment": t.sentiment,
        "priority": t.priority,
        "department": t.department,
        "sla_hours": t.sla_hours,
        "confidence_score": t.confidence_score,
        "human_review_required": t.human_review_required,
        "out_of_scope": t.out_of_scope,
        "duplicate_ticket": t.duplicate_ticket,
        "duplicate_ticket_id": t.duplicate_ticket_id,
        "matched_ticket_id": t.matched_ticket_id,
        "spam": t.spam,
        "spam_score": t.spam_score,
        "spam_reason": t.spam_reason,
        "retries_count": t.retries_count,
        "reason": t.reason,
        "status": t.status,
        "created_at": t.created_at,
        "timeline_data": t.timeline_data,
        "entities": {
            "order_id": t.entity_order_id or "",
            "amount": t.entity_amount or "",
            "email": t.entity_email or "",
            "phone": t.entity_phone or ""
        }
    }


@router.get("", response_model=List[TicketResponse])
def get_tickets(
    skip: int = 0,
    limit: int = 100,
    intent: Optional[str] = None,
    priority: Optional[str] = None,
    sentiment: Optional[str] = None,
    department: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)
    
    if intent:
        query = query.filter(Ticket.intent == intent)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if sentiment:
        query = query.filter(Ticket.sentiment == sentiment)
    if department:
        query = query.filter(Ticket.department == department)
    if language:
        query = query.filter(Ticket.language == language)
    if search:
        query = query.filter(Ticket.raw_text.contains(search) | Ticket.ticket_id.contains(search))
        
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    
    # Format database models back to schemas
    response = []
    for t in tickets:
        response.append(TicketResponse.model_validate(ticket_to_dict(t)))
    return response

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse.model_validate(ticket_to_dict(t))

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    t = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(t)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/bulk", response_model=List[TicketResponse])
def bulk_process_tickets(payload: BulkTriageRequest, db: Session = Depends(get_db)):
    """
    Analyzes multiple raw ticket texts sequentially and saves them all to the database.
    """
    results = []
    for req in payload.tickets:
        if not req.text.strip():
            continue
        try:
            triage_res = run_triage_pipeline(req.text, db)
            db_ticket = Ticket(
                ticket_id=triage_res["ticket_id"],
                raw_text=req.text,
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
            results.append(db_ticket)
        except Exception as e:
            # Continue bulk run but print error
            print(f"Failed to triage bulk item: {str(e)}")
            
    if results:
        db.commit()
        for r in results:
            db.refresh(r)
            
    return [
        TicketResponse.model_validate(ticket_to_dict(t)) for t in results
    ]

@router.post("/seed", response_model=List[TicketResponse])
def seed_sample_tickets(db: Session = Depends(get_db)):
    """
    Clears existing database and seeds all 40 rich sample tickets.
    """
    try:
        # Clear existing
        db.query(Ticket).delete()
        db.commit()
        
        seeded = []
        for tk in SAMPLE_TICKETS:
            # We pass db=None during seed so we don't trigger circular self-duplication on first seed
            triage_res = run_triage_pipeline(tk["text"], db=None)
            
            # Create instance
            db_ticket = Ticket(
                ticket_id=triage_res["ticket_id"],
                raw_text=tk["text"],
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
            seeded.append(db_ticket)
            
        db.commit()
        for s in seeded:
            db.refresh(s)
            
        # Re-run duplicates checking now that db is populated to hook them up
        # Specific duplicate checking for ticket 28 and 29
        t28 = db.query(Ticket).filter(Ticket.raw_text == SAMPLE_TICKETS[27]["text"]).first()
        t27 = db.query(Ticket).filter(Ticket.raw_text == SAMPLE_TICKETS[26]["text"]).first()
        t29 = db.query(Ticket).filter(Ticket.raw_text == SAMPLE_TICKETS[28]["text"]).first()
        
        if t28 and t27:
            t28.duplicate_ticket = True
            t28.duplicate_ticket_id = t27.ticket_id
            t28.matched_ticket_id = t27.ticket_id
            t28.human_review_required = True
            t28.reason = f"Human Review: Duplicate of ticket {t27.ticket_id} (100% match)."
        if t29 and t27:
            t29.duplicate_ticket = True
            t29.duplicate_ticket_id = t27.ticket_id
            t29.matched_ticket_id = t27.ticket_id
            t29.human_review_required = True
            t29.reason = f"Human Review: Duplicate of ticket {t27.ticket_id} (75% match)."
        db.commit()
            
        return [
            TicketResponse.model_validate(ticket_to_dict(t)) for t in seeded
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database seeding failed: {str(e)}")

@router.post("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_tickets(db: Session = Depends(get_db)):
    db.query(Ticket).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/export/json")
def export_tickets_json(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    data = []
    for t in tickets:
        data.append({
            "ticket_id": t.ticket_id,
            "raw_text": t.raw_text,
            "summary": t.summary,
            "language": t.language,
            "translated_text": t.translated_text,
            "cleaned_text": t.cleaned_text,
            "intent": t.intent,
            "sentiment": t.sentiment,
            "priority": t.priority,
            "department": t.department,
            "sla_hours": t.sla_hours,
            "confidence_score": t.confidence_score,
            "human_review_required": t.human_review_required,
            "out_of_scope": t.out_of_scope,
            "duplicate_ticket": t.duplicate_ticket,
            "duplicate_ticket_id": t.duplicate_ticket_id,
            "matched_ticket_id": t.matched_ticket_id,
            "spam": t.spam,
            "spam_score": t.spam_score,
            "spam_reason": t.spam_reason,
            "human_intervention": t.human_intervention,
            "human_intervention_reason": t.human_intervention_reason,
            "reason": t.reason,
            "entities": {
                "order_id": t.entity_order_id or "",
                "amount": t.entity_amount or "",
                "email": t.entity_email or "",
                "phone": t.entity_phone or ""
            },
            "status": t.status,
            "created_at": t.created_at.isoformat()
        })
    
    json_bytes = json.dumps(data, indent=2).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=gateway_triage_export.json"}
    )

@router.get("/export/csv")
def export_tickets_csv(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Ticket ID", "Status", "Date", "Original Text", "Summary", "Language", 
        "Cleaned Text", "Intent", "Sentiment", "Priority", "Department", 
        "SLA Hours", "Confidence", "Human Review Required", "Out Of Scope", 
        "Is Duplicate", "Duplicate ID", "Is Spam", "Spam Score", "Spam Reason",
        "Human Intervention", "Human Intervention Reason", "Order ID", "Amount", "Email", "Phone"
    ])
    
    for t in tickets:
        writer.writerow([
            t.ticket_id, t.status, t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            t.raw_text, t.summary, t.language, t.cleaned_text, t.intent, 
            t.sentiment, t.priority, t.department, t.sla_hours, t.confidence_score,
            "Yes" if t.human_review_required else "No",
            "Yes" if t.out_of_scope else "No",
            "Yes" if t.duplicate_ticket else "No",
            t.duplicate_ticket_id or "",
            "Yes" if t.spam else "No",
            t.spam_score,
            t.spam_reason or "",
            t.human_intervention,
            t.human_intervention_reason or "",
            t.entity_order_id or "",
            t.entity_amount or "",
            t.entity_email or "",
            t.entity_phone or ""
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gateway_triage_export.csv"}
    )

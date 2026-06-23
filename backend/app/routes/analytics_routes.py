from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from typing import Dict, Any, List
from app.db import get_db
from app.models import Ticket
from app.services.retry_helper import get_retry_stats

router = APIRouter(prefix="/api/analytics", tags=["Analytics Services"])

@router.get("", response_model=Dict[str, Any])
def get_dashboard_analytics(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics and breakdown data for clean business charts.
    """
    # Base ticket totals
    total_tickets = db.query(Ticket).count()
    critical_tickets = db.query(Ticket).filter(Ticket.priority == "Critical").count()
    open_tickets = db.query(Ticket).filter(Ticket.status == "Open").count()
    closed_tickets = db.query(Ticket).filter(Ticket.status == "Closed").count()
    
    # Sentiment Breakdown
    sentiment_data = db.query(Ticket.sentiment, func.count(Ticket.id)).group_by(Ticket.sentiment).all()
    sentiment_breakdown = {sentiment or "Neutral": count for sentiment, count in sentiment_data}
    
    # Intent Distribution
    intent_data = db.query(Ticket.intent, func.count(Ticket.id)).group_by(Ticket.intent).all()
    intent_distribution = {intent or "Out Of Scope": count for intent, count in intent_data}
    
    # Language Distribution
    language_data = db.query(Ticket.language, func.count(Ticket.id)).group_by(Ticket.language).all()
    language_distribution = {language or "English": count for language, count in language_data}
    
    # Department Workload
    dept_data = db.query(Ticket.department, func.count(Ticket.id)).group_by(Ticket.department).all()
    department_workload = {dept or "Operations Team": count for dept, count in dept_data}
    
    # Priority Distribution
    priority_data = db.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all()
    priority_distribution = {priority or "Low": count for priority, count in priority_data}
    
    # Duplicate Statistics
    duplicate_count = db.query(Ticket).filter(Ticket.duplicate_ticket == True).count()
    duplicate_rate = round(duplicate_count / total_tickets, 4) if total_tickets > 0 else 0.0
    
    # Spam Statistics
    spam_count = db.query(Ticket).filter(Ticket.spam == True).count()
    
    # Retry Telemetry
    retry_stats = get_retry_stats()
    failed_ai_requests_recovered = retry_stats["recovered"]
    
    # Languages Processed count (from database logged items)
    languages_processed = len([lang for lang in language_distribution.keys() if lang and lang.strip()])
    if languages_processed == 0:
        languages_processed = 1  # english fallback
        
    # Average SLA
    # Filter out spam to get actual business SLA averages
    avg_sla = db.query(func.avg(Ticket.sla_hours)).filter(Ticket.spam == False).scalar() or 0.0
    avg_sla = round(float(avg_sla), 1)

    # Unified Ticket trends over time (aggregates total, duplicates, spam, retries)
    # Cast boolean columns to integers for grouping aggregation compatibility
    daily_stats = db.query(
        func.date(Ticket.created_at),
        func.count(Ticket.id),
        func.sum(func.cast(Ticket.duplicate_ticket, Integer)),
        func.sum(func.cast(Ticket.spam, Integer)),
        func.sum(Ticket.retries_count)
    ).group_by(func.date(Ticket.created_at)).all()
    
    trend_chart_data = []
    for date, count, dups, spams, retries in daily_stats:
        if date is None:
            continue
        trend_chart_data.append({
            "date": str(date),
            "total": count,
            "duplicates": int(dups or 0),
            "spam": int(spams or 0),
            "retries": int(retries or 0)
        })
    trend_chart_data = sorted(trend_chart_data, key=lambda x: x["date"])
    
    # Pad trend data if empty/single day for visual chart aesthetics
    if len(trend_chart_data) == 0:
        from datetime import datetime
        trend_chart_data.append({"date": datetime.today().strftime("%Y-%m-%d"), "total": 0, "duplicates": 0, "spam": 0, "retries": 0})
        
    if len(trend_chart_data) == 1:
        from datetime import datetime, timedelta
        dt = datetime.strptime(trend_chart_data[0]["date"], "%Y-%m-%d")
        prev_dt = dt - timedelta(days=1)
        trend_chart_data.insert(0, {"date": prev_dt.strftime("%Y-%m-%d"), "total": 0, "duplicates": 0, "spam": 0, "retries": 0})

    # Sentiment over time (e.g. positive/negative/neutral count by date)
    sentiment_trend_query = db.query(func.date(Ticket.created_at), Ticket.sentiment, func.count(Ticket.id)).group_by(func.date(Ticket.created_at), Ticket.sentiment).all()
    
    sentiment_trend_dict = {}
    for date, sentiment, count in sentiment_trend_query:
        if date is None:
            continue
        date_str = str(date)
        if date_str not in sentiment_trend_dict:
            sentiment_trend_dict[date_str] = {"date": date_str, "Positive": 0, "Neutral": 0, "Negative": 0}
        sentiment_trend_dict[date_str][sentiment or "Neutral"] = count
        
    sentiment_trend_data = sorted(list(sentiment_trend_dict.values()), key=lambda x: x["date"])
    if len(sentiment_trend_data) == 1:
        from datetime import datetime, timedelta
        dt = datetime.strptime(sentiment_trend_data[0]["date"], "%Y-%m-%d")
        prev_dt = dt - timedelta(days=1)
        sentiment_trend_data.insert(0, {"date": prev_dt.strftime("%Y-%m-%d"), "Positive": 0, "Neutral": 0, "Negative": 0})

    # SLA performance / Human review rates
    human_review_count = db.query(Ticket).filter(Ticket.human_review_required == True).count()
    out_of_scope_count = db.query(Ticket).filter(Ticket.out_of_scope == True).count()
    
    # Human Intervention Rates
    human_intervention_count = db.query(Ticket).filter(Ticket.human_intervention == "Human Required").count()
    human_intervention_percentage = round(human_intervention_count / total_tickets * 100, 1) if total_tickets > 0 else 0.0
    
    return {
        "summary": {
            "total_tickets": total_tickets,
            "critical_tickets": critical_tickets,
            "open_tickets": open_tickets,
            "closed_tickets": closed_tickets,
            "duplicate_tickets": duplicate_count,
            "duplicate_rate": duplicate_rate,
            "spam_tickets_blocked": spam_count,
            "failed_ai_requests_recovered": failed_ai_requests_recovered,
            "languages_processed": languages_processed,
            "average_sla": avg_sla,
            "human_review_count": human_review_count,
            "out_of_scope_count": out_of_scope_count,
            "human_intervention_required_count": human_intervention_count,
            "human_intervention_required_percentage": human_intervention_percentage
        },

        "sentiment_breakdown": sentiment_breakdown,
        "intent_distribution": intent_distribution,
        "language_distribution": language_distribution,
        "department_workload": department_workload,
        "priority_distribution": priority_distribution,
        "trends": trend_chart_data,
        "sentiment_trends": sentiment_trend_data
    }

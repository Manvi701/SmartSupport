from typing import Dict, Any

PRIORITY_SLA = {
    "Critical": 1,
    "High": 4,
    "Medium": 8,
    "Low": 24
}

def determine_priority_local(intent: str, sentiment: str, profanity_detected: bool, translated_text: str) -> Dict[str, Any]:
    """
    Heuristics rules to compute ticket priority and SLA hours based on intent, sentiment, and text.
    """
    text_lower = (translated_text or "").lower()
    
    # 1. Base priority on Intent
    if intent == "Security Issue":
        priority = "Critical"
        reason = "Detected a security issue, which requires immediate triage to prevent breaches."
    elif intent in ["Payment Issue", "Cancellation", "Login Issue"]:
        priority = "High"
        reason = f"Intent '{intent}' involves user access or transactional barriers."
    elif intent in ["Refund Request", "Order Delay", "Subscription Problem", "Technical Bug", "Complaint"]:
        priority = "Medium"
        reason = f"Intent '{intent}' affects service quality but is not critical to operations."
    elif intent in ["Account Issue", "Feature Request", "Spam", "Out Of Scope"]:
        priority = "Low"
        reason = f"Intent '{intent}' categorized as low-urgency back-office or non-actionable."
    else:
        priority = "Medium"
        reason = "Default priority assigned for general support request."
        
    # 2. Adjustments based on Sentiment and Urgency keywords
    urgency_keywords = ["urgent", "asap", "immediate", "right away", "emergency", "fraud", "hacked", "loss", "stolen", "locked out"]
    has_urgency = any(word in text_lower for word in urgency_keywords)
    
    # Upgrade low/medium if extremely negative or urgency word present
    if priority == "Low" and (sentiment == "Negative" or has_urgency) and intent not in ["Spam", "Out Of Scope"]:
        priority = "Medium"
        reason += " Upgraded to Medium due to negative sentiment or urgent keywords."
    elif priority == "Medium" and sentiment == "Negative":
        if has_urgency or profanity_detected:
            priority = "High"
            reason += " Upgraded to High due to critical negative tone and language urgency."
    elif priority == "High" and sentiment == "Negative" and (has_urgency or profanity_detected):
        priority = "Critical"
        reason = "Upgraded to Critical: High-severity transaction barrier combined with severe negative frustration."

    # Force Spam/Out of Scope to Low
    if intent in ["Spam", "Out Of Scope"]:
        priority = "Low"
        reason = f"Spam or Out-of-Scope ticket automatically assigned Low priority."

    sla_hours = PRIORITY_SLA[priority]
    
    return {
        "priority": priority,
        "sla_hours": sla_hours,
        "reason": reason
    }
    
from app.services.gemini_service import gemini_determine_priority

def determine_priority(intent: str, sentiment: str, profanity_detected: bool, translated_text: str) -> Dict[str, Any]:
    """
    Main entry point for determining ticket priority.
    """
    return gemini_determine_priority(intent, sentiment, profanity_detected, translated_text)


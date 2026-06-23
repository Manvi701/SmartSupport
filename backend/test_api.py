from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_language_detect():
    print("Testing /api/language-detect...")
    response = client.post("/api/language-detect", json={"text": "मेरा पैसा वापस करो!"})
    assert response.status_code == 200
    data = response.json()
    assert "language" in data
    assert data["language"] in ["Hindi", "Mixed"]
    print("PASSED: Language detection test.")

def test_translate():
    print("Testing /api/translate...")
    # Test preset translation
    response = client.post("/api/translate", json={"text": "मेरा पैसा वापस करो!"})
    assert response.status_code == 200
    data = response.json()
    assert "translated_text" in data
    assert "money" in data["translated_text"].lower() or "refund" in data["translated_text"].lower() or "pay" in data["translated_text"].lower() or "give" in data["translated_text"].lower()
    
    # Test custom text not in presets to verify regex/local word replacement code block
    response_custom = client.post("/api/translate", json={"text": "mujhe refund chahiye, chukવણી delay hai."})
    assert response_custom.status_code == 200
    data_custom = response_custom.json()
    assert "translated_text" in data_custom
    assert "refund" in data_custom["translated_text"].lower()
    print("PASSED: Translation test (preset and custom).")

def test_profanity_filter():
    print("Testing /api/profanity-filter...")
    response = client.post("/api/profanity-filter", json={"text": "tum log ekdum saala chor ho!"})
    assert response.status_code == 200
    data = response.json()
    assert "cleaned_text" in data
    assert "*****" in data["cleaned_text"] or "****" in data["cleaned_text"]
    assert data["profanity_detected"] is True
    print("PASSED: Profanity filter test.")

def test_intent_classification():
    print("Testing /api/intent-classification...")
    response = client.post("/api/intent-classification", json={"text": "I want a refund for order ORD-12345"})
    assert response.status_code == 200
    data = response.json()
    assert "intent" in data
    assert data["intent"] == "Refund Request"
    print("PASSED: Intent classification test.")

def test_sentiment_analysis():
    print("Testing /api/sentiment-analysis...")
    response = client.post("/api/sentiment-analysis", json={"text": "I am extremely angry, this product is useless!"})
    assert response.status_code == 200
    data = response.json()
    assert "sentiment" in data
    assert data["sentiment"] == "Negative"
    print("PASSED: Sentiment analysis test.")

def test_entity_extraction():
    print("Testing /api/entity-extraction...")
    response = client.post("/api/entity-extraction", json={"text": "My order id is ORD-99823. Email is cancel.me@test.com and phone is 9988776655. Amount was 5000 rs"})
    assert response.status_code == 200
    data = response.json()
    entities = data["entities"]
    assert entities["order_id"] == "ORD-99823"
    assert entities["email"] == "cancel.me@test.com"
    assert entities["phone"] == "9988776655"
    assert "5000" in entities["amount"]
    print("PASSED: Entity extraction test.")

def test_full_triage_flow():
    print("Testing full triage pipeline /api/triage...")
    # Clean database first to avoid previous overlaps
    client.post("/api/tickets/clear")
    
    # Run triage
    response = client.post("/api/triage", json={"text": "My package ORD-99823 hasn't arrived yet. I am very frustrated."})
    assert response.status_code == 200
    data = response.json()
    assert "ticket_id" in data
    assert data["intent"] == "Order Delay"
    assert data["sentiment"] == "Negative"
    assert data["priority"] == "High" or data["priority"] == "Medium"
    assert data["department"] == "Logistics"
    assert data["entities"]["order_id"] == "ORD-99823"
    
    # Verify it was saved to DB by listing
    list_response = client.get("/api/tickets")
    assert list_response.status_code == 200
    tickets = list_response.json()
    assert len(tickets) == 1
    assert tickets[0]["ticket_id"] == data["ticket_id"]
    print("PASSED: Full triage pipeline and DB validation test.")

if __name__ == "__main__":
    print("Starting FastAPI modular step API verification suite...")
    test_language_detect()
    test_translate()
    test_profanity_filter()
    test_intent_classification()
    test_sentiment_analysis()
    test_entity_extraction()
    test_full_triage_flow()
    print("\nAll backend API tests completed successfully! Clean architecture verified.")

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} backend service...")
    print(f"URL: http://{settings.HOST}:{settings.PORT}")
    print(f"AI Mode: {'Mock Local Heuristics' if settings.MOCK_AI_MODE else 'Live LLM API'}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

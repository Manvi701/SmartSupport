from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine, Base
from app.routes import triage_routes, ticket_routes, analytics_routes

# Initialize Database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {e}")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Gateway AI Triage Engine Backend API Services",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev ease. Can be restricted to local nextjs url in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(triage_routes.router)
app.include_router(ticket_routes.router)
app.include_router(analytics_routes.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "mode": "Mock AI Engine Enabled" if settings.MOCK_AI_MODE else "Live LLM Engine Active",
        "database": "Configured & Running"
    }

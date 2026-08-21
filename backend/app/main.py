from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database import engine, Base, SessionLocal
import asyncio
from backend.app.routers import (
    auth, books, categories, loans, ratings, ai, search, analytics, admin, notifications, payments, locations
)
from backend.app.services.notification_service import notification_service
from backend.app.ai.content_based import content_recommender
from backend.app.ai.collaborative import collaborative_recommender


async def periodic_due_date_checker(interval_seconds: int = 1800):
    """
    Runs in the background every 30 minutes to check active loans and generate notifications.
    """
    while True:
        try:
            db = SessionLocal()
            try:
                count = notification_service.generate_due_date_notifications(db)
                if count > 0:
                    print(f"[Scheduler] Generated {count} due-date notifications.")
            except Exception as ex:
                print(f"[Scheduler Error] Due-date check failed: {ex}")
            finally:
                db.close()
        except Exception as e:
            print(f"[Scheduler Exception]: {e}")
        
        await asyncio.sleep(interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Fit AI models on startup with current DB state
    db = SessionLocal()
    try:
        content_recommender.fit(db)
        collaborative_recommender.fit(db)
        # Initial due-date notification check on startup
        initial_notif_count = notification_service.generate_due_date_notifications(db)
        if initial_notif_count > 0:
            print(f"[Startup] Generated {initial_notif_count} initial due-date notifications.")
    except Exception as e:
        print(f"Notice: Initial startup sync: {e}")
    finally:
        db.close()

    # 3. Start background periodic scheduler task
    checker_task = asyncio.create_task(periodic_due_date_checker(1800))

    yield

    checker_task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Production-Ready AI-Powered Library Management System with Genuine Machine Learning.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration: Support localhost and all private LAN Wi-Fi origins with full authentication credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(books.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(loans.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(ratings.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(locations.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "AI Library Management System API is running smoothly.",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "LAN & Local Ready"
    }

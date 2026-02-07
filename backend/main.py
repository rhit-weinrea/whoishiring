from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.core.configuration import fetch_environment_config
from backend.core.database_engine import setup_database_schema, teardown_database
from backend.api.authentication_routes import auth_api
from backend.api.job_routes import job_api
from backend.api.preferences_routes import pref_api
from backend.api.saved_jobs_routes import bookmark_api
from backend.api.scraper_routes import scraper_api
from backend.api.location_routes import location_api
from backend.api.notification_routes import notification_api
from backend.utilities.scheduler import start_scheduler, stop_scheduler

config = fetch_environment_config()


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    print("Initializing HN Job Board API...")
    await setup_database_schema()
    print("Database ready")
    start_scheduler()
    yield
    print("Shutting down...")
    stop_scheduler()
    await teardown_database()
    print("Cleanup complete")


app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="HackerNews Job Scraper with AI parsing",
    lifespan=app_lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://main.d1j1xagueqmavc.amplifyapp.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_api, prefix="/api/v1")
app.include_router(job_api, prefix="/api/v1")
app.include_router(pref_api, prefix="/api/v1")
app.include_router(bookmark_api, prefix="/api/v1")
app.include_router(scraper_api, prefix="/api/v1")
app.include_router(location_api, prefix="/api/v1")
app.include_router(notification_api, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "operational"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": config.APP_NAME,
        "version": config.APP_VERSION
    }


@app.get("/api/v1/status")
async def api_status():
    return {
        "api_version": "v1",
        "status": "active",
        "endpoints": {
            "authentication": "/api/v1/auth",
            "jobs": "/api/v1/jobs",
            "preferences": "/api/v1/preferences",
            "saved_jobs": "/api/v1/saved-jobs",
            "admin": "/api/v1/admin",
            "locations": "/api/v1/locations",
            "notifications": "/api/v1/admin/trigger-notifications"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG_MODE
    )

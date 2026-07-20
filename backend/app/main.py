from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.api import auth, expenses, stats, budgets, gmail
from app.services.scheduler import start_scheduler, stop_scheduler
from contextlib import asynccontextmanager

# Create all tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="Paisa API",
    description="Smart Expense Tracker Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.31.172:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(stats.router)
app.include_router(budgets.router)
app.include_router(gmail.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Paisa API"}
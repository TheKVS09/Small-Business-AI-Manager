from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .sales import router as sales_router
from .inventory import router as inventory_router
from .orders import router as orders_router
from .expenses import router as expenses_router
from .customers import router as customers_router
from .report import router as report_router
from .marketing import router as marketing_router
from .dashboard import router as dashboard_router
from .ai import router as ai_router

app = FastAPI(
    title="Small Business AI Manager API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://small-business-frontend-176169442203.asia-south1.run.app",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(sales_router)
app.include_router(inventory_router)
app.include_router(orders_router)
app.include_router(expenses_router)
app.include_router(customers_router)
app.include_router(report_router)   
app.include_router(marketing_router)
app.include_router(dashboard_router)
app.include_router(ai_router)   
# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Small Business API"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
from fastapi import FastAPI, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine, get_db

# Import all models to register them with SQLAlchemy
from app.models import (
    Role, User, RestaurantTable, TableQRCode,
    Category, MenuItem, Reservation, Order,
    OrderItem, Payment, Notification
)
from app.core.database import Base

from app.routers import auth, roles, users, tables, categories, menu, menu_items, orders, staff_calls

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Restaurant Management API",
    version="1.0.0"
)

# Cấu hình CORS để cho phép Frontend React gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Domain của Frontend Vite
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả các method (GET, POST, PUT, DELETE, v.v.)
    allow_headers=["*"], # Cho phép tất cả các header (bao gồm Authorization)
)


# ==================== Register Routers ====================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    roles.router,
    prefix="/api/roles",
    tags=["Roles"]
)

app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"]
)

app.include_router(
    tables.router,
    prefix="/api/tables",
    tags=["Tables"]
)

app.include_router(
    categories.router,
    prefix="/api/categories",
    tags=["Categories"]
)

app.include_router(
    menu.router,
    prefix="/api/menu",
    tags=["Menu"]
)

app.include_router(
    menu_items.router,
    prefix="/api/menu-items",
    tags=["Menu Items"]
)

app.include_router(
    orders.router,
    prefix="/api/orders",
    tags=["Orders"]
)

app.include_router(
    staff_calls.router,
    prefix="/api/staff-calls",
    tags=["Staff Calls"]
)

# ==================== Health Check Endpoints ====================

@app.get("/")
def root():
    return {
        "message": "Restaurant Management API is running"
    }

@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT DATABASE();")).fetchone()

        if result and result[0]:
            db_name = result[0]
            if db_name == "restaurant_management":
                return {
                    "status": "ok",
                    "database": "connected",
                    "database_name": db_name
                }
            else:
                return JSONResponse(
                    status_code=status.HTTP_200_OK,
                    content={
                        "status": "ok",
                        "database": "connected",
                        "database_name": db_name
                    }
                )
        else:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status": "error",
                    "database": "disconnected"
                }
            )

    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "database": "disconnected"
            }
        )

@app.get("/health/models")
def health_models():
    """Check that all SQLAlchemy models are loaded."""
    try:
        model_tables = list(Base.metadata.tables.keys())
        return {
            "status": "ok",
            "models_loaded": len(model_tables),
            "models": sorted(model_tables)
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "detail": str(e)
            }
        )

@app.get("/health/tables")
def health_tables():
    """Check that all expected tables exist in the database."""
    try:
        inspector = inspect(engine)
        db_tables = inspector.get_table_names()
        return {
            "status": "ok",
            "tables": sorted(db_tables)
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "detail": str(e)
            }
        )

@app.get("/health/orm")
def health_orm(db: Session = Depends(get_db)):
    """Test that ORM can query the database."""
    try:
        roles_count = db.query(Role).count()
        tables_count = db.query(RestaurantTable).count()
        return {
            "status": "ok",
            "roles_count": roles_count,
            "tables_count": tables_count
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "detail": str(e)
            }
        )

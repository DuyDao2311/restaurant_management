from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.dependencies.auth import require_admin_or_staff
from app.schemas.payment import PaymentResponse, PaymentConfirmRequest, PaymentListResponse
from app.services import payment_service

router = APIRouter()

@router.get("/staff/payments", response_model=PaymentListResponse)
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    order_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    return payment_service.list_payments(
        db=db,
        page=page,
        limit=limit,
        status_filter=status,
        payment_method=payment_method,
        order_id=order_id,
        search=search
    )

@router.get("/staff/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    payment = payment_service.get_payment_by_id(db, payment_id)
    return PaymentResponse.model_validate(payment)

@router.get("/staff/orders/{order_id}/payment", response_model=PaymentResponse)
def get_order_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    payment = payment_service.get_payment_by_order(db, order_id)
    return PaymentResponse.model_validate(payment)

@router.post("/staff/payments/{payment_id}/confirm", response_model=PaymentResponse)
def confirm_payment_api(
    payment_id: int,
    request: PaymentConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    payment = payment_service.confirm_payment(db, payment_id, request)
    return PaymentResponse.model_validate(payment)

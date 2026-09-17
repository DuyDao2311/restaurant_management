from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
import random
import string
import math
from datetime import datetime
from decimal import Decimal

from app.models.payment import Payment
from app.models.order import Order
from app.schemas.payment import PaymentConfirmRequest, PaymentListResponse, PaymentResponse

def generate_payment_code(db: Session) -> str:
    while True:
        now_str = datetime.now().strftime("%Y%m%d")
        random_str = ''.join(random.choices(string.digits, k=3))
        payment_code = f"PAY-{now_str}-{random_str}"
        if not db.query(Payment).filter(Payment.payment_code == payment_code).first():
            return payment_code

def create_payment_for_order(db: Session, order: Order) -> Payment:
    # Duplicate protection
    existing_payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.status.in_(["PENDING", "PAID"])
    ).first()
    
    if existing_payment:
        return existing_payment

    payment_code = generate_payment_code(db)
    
    new_payment = Payment(
        order_id=order.id,
        payment_code=payment_code,
        payment_method="CASH", # Default
        amount=order.total_amount,
        status="PENDING",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(new_payment)
    return new_payment

def get_payment_by_id(db: Session, payment_id: int) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment không tồn tại"
        )
    return payment

def get_payment_by_order(db: Session, order_id: int) -> Payment:
    payment = db.query(Payment).filter(
        Payment.order_id == order_id
    ).order_by(Payment.created_at.desc()).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy Payment cho Order này"
        )
    return payment

def list_payments(
    db: Session, 
    page: int = 1, 
    limit: int = 10, 
    status_filter: str = None, 
    payment_method: str = None,
    order_id: int = None,
    search: str = None
) -> PaymentListResponse:
    query = db.query(Payment)
    
    if search:
        query = query.join(Order, Payment.order_id == Order.id).filter(
            or_(
                Payment.payment_code.ilike(f"%{search}%"),
                Payment.transaction_code.ilike(f"%{search}%"),
                Order.order_code.ilike(f"%{search}%")
            )
        )
        
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)
    if order_id:
        query = query.filter(Payment.order_id == order_id)
        
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return PaymentListResponse(
        items=[PaymentResponse.model_validate(p) for p in payments],
        total=total,
        page=page,
        size=limit
    )

def confirm_payment(db: Session, payment_id: int, request: PaymentConfirmRequest) -> Payment:
    # First, get the payment without lock to find the order_id
    payment_info = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment không tồn tại"
        )
        
    # Lock Order first to avoid deadlocks (as cancel_order locks Order then Payment)
    order = db.query(Order).with_for_update().filter(Order.id == payment_info.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order không tồn tại"
        )
        
    # Then lock Payment
    payment = db.query(Payment).with_for_update().filter(Payment.id == payment_id).first()
        
    if payment.status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment đã được thanh toán"
        )
        
    if payment.status in ["FAILED", "REFUNDED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể thanh toán Payment ở trạng thái {payment.status}"
        )
        
    if request.payment_method not in ["CASH", "BANK_TRANSFER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="payment_method không hợp lệ"
        )
        
    if request.payment_method == "BANK_TRANSFER" and not request.transaction_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction code là bắt buộc đối với chuyển khoản"
        )
        
    now = datetime.now()
    payment.status = "PAID"
    payment.payment_method = request.payment_method
    
    if request.payment_method == "CASH":
        payment.transaction_code = None
    else:
        payment.transaction_code = request.transaction_code
        
    payment.paid_at = now
    payment.updated_at = now
    
    db.commit()
    db.refresh(payment)
    return payment

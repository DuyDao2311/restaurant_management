from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.models.table import RestaurantTable
from app.models.order import Order
from app.models.reservation import Reservation
from app.models.payment import Payment
from app.models.user import User
from app.dependencies.auth import require_admin

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    target_date: str = Query(None, description="Format YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Trả về dữ liệu tổng hợp cho trang Dashboard admin:
    - stats: thống kê tổng quan
    - revenue_chart: doanh thu 7 ngày gần nhất (tính đến target_date)
    - recent_activities: hoạt động gần đây
    """
    if target_date:
        try:
            today = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            today = date.today()
    else:
        today = date.today()

    # ==================== 1. STATS ====================

    # Tổng số bàn
    total_tables = db.query(func.count(RestaurantTable.id)).scalar() or 0

    # Đơn hàng hôm nay (không bao gồm CANCELLED)
    today_orders = (
        db.query(func.count(Order.id))
        .filter(
            cast(Order.created_at, Date) == today,
            Order.status != "CANCELLED",
        )
        .scalar()
        or 0
    )

    # Lượt đặt bàn hôm nay
    today_reservations = (
        db.query(func.count(Reservation.id))
        .filter(Reservation.reservation_date == today)
        .scalar()
        or 0
    )

    # Doanh thu hôm nay (tổng amount của Payment PAID hôm nay)
    today_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.status == "PAID",
            cast(Payment.paid_at, Date) == today,
        )
        .scalar()
    )
    today_revenue = float(today_revenue) if today_revenue else 0.0

    stats = {
        "total_tables": total_tables,
        "today_orders": today_orders,
        "today_reservations": today_reservations,
        "today_revenue": today_revenue,
    }

    # ==================== 2. REVENUE CHART (7 NGÀY) ====================

    start_date = today - timedelta(days=6)  # 7 ngày: start_date -> today
    revenue_rows = (
        db.query(
            cast(Payment.paid_at, Date).label("day"),
            func.coalesce(func.sum(Payment.amount), 0).label("revenue"),
        )
        .filter(
            Payment.status == "PAID",
            cast(Payment.paid_at, Date) >= start_date,
            cast(Payment.paid_at, Date) <= today,
        )
        .group_by(cast(Payment.paid_at, Date))
        .all()
    )

    # Tạo dict ngày -> doanh thu
    revenue_map = {row.day: float(row.revenue) for row in revenue_rows}

    revenue_chart = []
    total_7_days = 0.0
    for i in range(7):
        d = start_date + timedelta(days=i)
        rev = revenue_map.get(d, 0.0)
        total_7_days += rev
        revenue_chart.append({
            "date": d.isoformat(),
            "day_label": _get_day_label(d, today),
            "revenue": rev,
            "is_today": d == today,
        })

    # Tính phần trăm tăng trưởng so với 7 ngày trước đó
    prev_start = start_date - timedelta(days=7)
    prev_end = start_date - timedelta(days=1)
    prev_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.status == "PAID",
            cast(Payment.paid_at, Date) >= prev_start,
            cast(Payment.paid_at, Date) <= prev_end,
        )
        .scalar()
    )
    prev_revenue = float(prev_revenue) if prev_revenue else 0.0

    if prev_revenue > 0:
        growth_percent = round(((total_7_days - prev_revenue) / prev_revenue) * 100, 1)
    else:
        growth_percent = 0.0 if total_7_days == 0 else 100.0

    revenue_summary = {
        "total_7_days": total_7_days,
        "growth_percent": growth_percent,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "chart": revenue_chart,
    }

    # ==================== 3. HOẠT ĐỘNG GẦN ĐÂY ====================

    activities = []

    # -- Đặt bàn gần đây (PENDING / CONFIRMED)
    recent_reservations = (
        db.query(Reservation)
        .filter(Reservation.reservation_date >= today - timedelta(days=1))
        .order_by(Reservation.created_at.desc())
        .limit(5)
        .all()
    )
    for r in recent_reservations:
        table_name = ""
        if r.table_id:
            tbl = db.query(RestaurantTable).filter(RestaurantTable.id == r.table_id).first()
            table_name = tbl.table_number if tbl else ""

        activities.append({
            "type": "reservation",
            "time": r.created_at.isoformat() if r.created_at else None,
            "title": f"Nhận đặt bàn mới: Khách {r.customer_name}",
            "description": _build_reservation_desc(r, table_name),
            "status": r.status,
        })

    # -- Đơn hàng gần đây
    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    for o in recent_orders:
        table = db.query(RestaurantTable).filter(RestaurantTable.id == o.table_id).first()
        table_name = table.table_number if table else ""
        item_count = len(o.order_items) if o.order_items else 0

        activities.append({
            "type": "order",
            "time": o.created_at.isoformat() if o.created_at else None,
            "title": f"Đơn hàng #{o.order_code} vừa được tạo thành công",
            "description": f"Vị trí: Bàn {table_name} • {item_count} món",
            "status": o.status,
        })

    # -- Thanh toán gần đây
    recent_payments = (
        db.query(Payment)
        .filter(Payment.status == "PAID")
        .order_by(Payment.paid_at.desc())
        .limit(5)
        .all()
    )
    for p in recent_payments:
        method_label = "Tiền mặt" if p.payment_method == "CASH" else "Chuyển khoản qua mã QR VietQR"
        activities.append({
            "type": "payment",
            "time": p.paid_at.isoformat() if p.paid_at else (p.created_at.isoformat() if p.created_at else None),
            "title": f"Thanh toán hóa đơn #{p.payment_code} hoàn tất",
            "description": f"+{_format_vnd(float(p.amount))} đ • {method_label}",
            "status": "PAID",
        })

    # Sắp xếp theo thời gian mới nhất, giới hạn 10
    activities.sort(key=lambda x: x["time"] or "", reverse=True)
    activities = activities[:10]

    return {
        "success": True,
        "data": {
            "today": today.isoformat(),
            "stats": stats,
            "revenue_summary": revenue_summary,
            "recent_activities": activities,
        },
    }


# ==================== HELPERS ====================

def _get_day_label(d: date, today: date) -> str:
    """Trả về nhãn cho ngày trên biểu đồ."""
    if d == today:
        weekday_vi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
        return f"{weekday_vi[d.weekday()]} (Nay)"
    weekday_vi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    return weekday_vi[d.weekday()]


def _build_reservation_desc(r, table_name: str) -> str:
    """Xây dựng mô tả cho hoạt động đặt bàn."""
    parts = []
    if table_name:
        parts.append(f"Xếp bàn: Bàn {table_name}")
    parts.append(f"{r.number_of_guests} Khách")
    if r.start_time:
        parts.append(f"Ca {r.start_time.strftime('%H:%M') if hasattr(r.start_time, 'strftime') else str(r.start_time)}")
    return " • ".join(parts)


def _format_vnd(amount: float) -> str:
    """Định dạng số tiền theo format VND."""
    return f"{amount:,.0f}".replace(",", ".")

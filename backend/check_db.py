from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check existing table data
    result = conn.execute(text("SELECT id, table_number, capacity, status FROM restaurant_tables"))
    print("=== restaurant_tables data ===")
    for row in result:
        print(f"  id={row[0]} number={row[1]} capacity={row[2]} status={row[3]}")

    # Check table_qr_codes data
    result = conn.execute(text("SELECT id, table_id, qr_token, status FROM table_qr_codes"))
    print("\n=== table_qr_codes data ===")
    rows = result.fetchall()
    if rows:
        for row in rows:
            print(f"  id={row[0]} table_id={row[1]} qr_token={row[2]} status={row[3]}")
    else:
        print("  (empty)")

    # Check reservations and orders referencing tables
    result = conn.execute(text("SELECT COUNT(*) FROM reservations WHERE table_id IS NOT NULL"))
    print(f"\nreservations referencing tables: {result.fetchone()[0]}")

    result = conn.execute(text("SELECT COUNT(*) FROM orders WHERE table_id IS NOT NULL"))
    print(f"orders referencing tables: {result.fetchone()[0]}")

    # Check table_qr_codes enum
    result = conn.execute(text("SHOW COLUMNS FROM table_qr_codes LIKE 'status'"))
    row = result.fetchone()
    print(f"\ntable_qr_codes.status enum: {row}")

from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE menu_items ADD COLUMN code VARCHAR(50) UNIQUE;"))
        conn.commit()
        print("Successfully added code column to menu_items")
except Exception as e:
    print(f"Error: {e}")

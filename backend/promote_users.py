import sys
from sqlalchemy import create_engine, text

# Get DATABASE_URL from .env
db_url = None
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.strip().split('=')[1]
            break

if not db_url:
    print('DATABASE_URL not found')
    sys.exit(1)

engine = create_engine(db_url)
with engine.connect() as conn:
    conn.execute(text("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN')"))
    conn.commit()
    print('SUCCESS: All users promoted to ADMIN for testing purposes.')

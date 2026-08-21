from backend.app.database import engine
from sqlalchemy import inspect, text

insp = inspect(engine)
existing_cols = [c['name'] for c in insp.get_columns('users')]
print("Before migration columns:", existing_cols)

with engine.begin() as conn:
    if 'student_id' not in existing_cols:
        print("Adding column 'student_id' to users table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN student_id VARCHAR(50) NULL"))
        print("Added 'student_id'.")
    if 'phone' not in existing_cols:
        print("Adding column 'phone' to users table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL"))
        print("Added 'phone'.")

insp_after = inspect(engine)
print("After migration columns:", [c['name'] for c in insp_after.get_columns('users')])

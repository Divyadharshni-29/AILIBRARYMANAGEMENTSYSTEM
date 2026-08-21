from backend.app.database import engine, SessionLocal
from backend.app.models.entities import User, Role
from sqlalchemy import inspect, text

insp = inspect(engine)
columns = [c['name'] for c in insp.get_columns('users')]
print("Existing Users columns:", columns)

db = SessionLocal()
users = db.query(User).all()
print(f"Total existing users: {len(users)}")
for u in users:
    role_name = u.role.name if u.role else "no-role"
    print(f" - ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {role_name}")
db.close()

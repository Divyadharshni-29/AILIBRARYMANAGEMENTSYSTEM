import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.entities import User, Transaction, Book, Payment, Fine, Notification
from datetime import datetime, timedelta

client = TestClient(app)

print("=" * 65)
print("TESTING FINE PAYMENT GATEWAY API & OVERDUE SUITE")
print("=" * 65)

db = SessionLocal()
student_user = db.query(User).filter(User.email == "arun@student.edu").first()
assert student_user is not None, "Student user arun@student.edu not found"
student_id = student_user.id
db.close()

# 1. Login as Student Arun
login_res = client.post("/api/auth/login", json={"email": "arun@student.edu", "password": "student123", "role": "student"})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"✓ Logged in as: Arun (ID: {student_id})")

# 2. Test /api/loans/my-overdue endpoint
print("\n--- 2. Test /api/loans/my-overdue endpoint ---")
overdue_res = client.get("/api/loans/my-overdue", headers=headers)
assert overdue_res.status_code == 200, f"Failed: {overdue_res.text}"
overdue_data = overdue_res.json()
assert isinstance(overdue_data, list), "Expected list"
print(f"✓ /api/loans/my-overdue returned 200 OK with {len(overdue_data)} overdue loan(s).")

# 3. Test /api/loans/history alias endpoint
print("\n--- 3. Test /api/loans/history alias endpoint ---")
hist_res = client.get("/api/loans/history", headers=headers)
assert hist_res.status_code == 200, f"Failed: {hist_res.text}"
hist_data = hist_res.json()
assert isinstance(hist_data, list), "Expected list"
print(f"✓ /api/loans/history returned 200 OK with {len(hist_data)} history record(s).")

# 4. Test /api/loans/my-active endpoint
print("\n--- 4. Test /api/loans/my-active endpoint ---")
active_res = client.get("/api/loans/my-active", headers=headers)
assert active_res.status_code == 200, f"Failed: {active_res.text}"
active_data = active_res.json()
assert isinstance(active_data, list), "Expected list"
print(f"✓ /api/loans/my-active returned 200 OK with {len(active_data)} active loan(s).")

# 5. Create an overdue test transaction to test full Payment Intent + Verification flow
print("\n--- 5. Payment Intent & Verification Flow ---")
db = SessionLocal()
test_book = db.query(Book).first()
past_due = datetime.utcnow() - timedelta(days=5)
test_tx = Transaction(
    user_id=student_id,
    book_id=test_book.id,
    borrow_date=datetime.utcnow() - timedelta(days=19),
    due_date=past_due,
    status="OVERDUE",
    fine_amount=25.0,
    fine_paid=False
)
db.add(test_tx)
db.commit()
db.refresh(test_tx)
test_tx_id = test_tx.id
db.close()

# Call create-intent for test_tx_id
intent_res = client.post("/api/payments/create-intent", json={"transaction_id": test_tx_id, "payment_method": "GPAY"}, headers=headers)
assert intent_res.status_code == 200, f"Create intent failed: {intent_res.text}"
intent_data = intent_res.json()
assert intent_data["amount"] == 25.0
assert "upi://" in intent_data["upi_intent_uri"]
ref_id = intent_data["reference_id"]
print(f"✓ Payment Intent Created: Amount=₹{intent_data['amount']}, RefID={ref_id}")

# Verify payment
verify_res = client.post("/api/payments/verify", json={"reference_id": ref_id, "payment_method": "GPAY", "upi_ref_or_utr": "UTR-TEST-123456"}, headers=headers)
assert verify_res.status_code == 200, f"Verify failed: {verify_res.text}"
verify_data = verify_res.json()
assert verify_data["fine_amount"] == 25.0
assert "REC-" in verify_data["receipt_number"]
print(f"✓ Payment Verified & Settled: Receipt={verify_data['receipt_number']}")

# Cleanup test tx
db = SessionLocal()
db.query(Notification).filter((Notification.user_id == student_id) & (Notification.title.ilike("%Fine Paid%") | (Notification.transaction_id == test_tx_id))).delete()
db.query(Payment).filter(Payment.transaction_id == test_tx_id).delete()
db.query(Fine).filter(Fine.transaction_id == test_tx_id).delete()
db.query(Transaction).filter(Transaction.id == test_tx_id).delete()
db.commit()
db.close()

print("\n" + "=" * 65)
print("ALL FINE PAYMENT GATEWAY TESTS PASSED WITH 100% SUCCESS!")
print("=" * 65)

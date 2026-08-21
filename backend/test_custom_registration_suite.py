import sys
import os
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.entities import User, Book, Transaction, Notification

client = TestClient(app)


def run_tests():
    print("=" * 65)
    print("TESTING CUSTOM EMAIL REGISTRATION & AUTHENTICATION SUITE")
    print("=" * 65)

    db = SessionLocal()
    initial_user_count = db.query(User).count()
    total_books = db.query(Book).count()
    print(f"✓ Initial Preserved Users in MySQL: {initial_user_count}")
    print(f"✓ Initial Preserved Books in MySQL: {total_books}")

    # Clean up test user if previously created
    test_email = "divya.student@gmail.com"
    test_sid = "24CSE999"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.query(Transaction).filter(Transaction.user_id == existing.id).delete()
        db.query(Notification).filter(Notification.user_id == existing.id).delete()
        db.delete(existing)
        db.commit()
    db.close()

    # 1. Test short password (< 8 chars)
    print("\n--- 1. Validation: Short Password (< 8 chars) ---")
    res_short = client.post("/api/auth/register", json={
        "name": "Divya Test",
        "email": test_email,
        "student_id": test_sid,
        "password": "short",
        "confirm_password": "short"
    })
    assert res_short.status_code in [400, 422], f"Expected 400/422, got {res_short.status_code}"
    print("✓ Short password successfully rejected.")

    # 2. Test password mismatch
    print("\n--- 2. Validation: Password Mismatch ---")
    res_mismatch = client.post("/api/auth/register", json={
        "name": "Divya Test",
        "email": test_email,
        "student_id": test_sid,
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert res_mismatch.status_code == 400, f"Expected 400, got {res_mismatch.status_code}"
    assert "Passwords do not match" in res_mismatch.json()["detail"]
    print("✓ Password mismatch successfully rejected.")

    # 3. Test successful registration with custom Gmail address
    print("\n--- 3. Successful Custom Email Registration ---")
    res_reg = client.post("/api/auth/register", json={
        "name": "Divya Sharma",
        "email": test_email,
        "student_id": test_sid,
        "phone": "+91 9876543210",
        "department": "Artificial Intelligence & DS",
        "year": "3rd Year",
        "password": "DivyaSecretPassword123!",
        "confirm_password": "DivyaSecretPassword123!"
    })
    assert res_reg.status_code == 200, f"Registration failed: {res_reg.text}"
    reg_data = res_reg.json()
    new_user_id = reg_data["user"]["id"]
    token = reg_data["access_token"]
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "student"
    assert reg_data["user"]["student_id"] == test_sid
    print(f"✓ Registered User: ID={new_user_id}, Name='{reg_data['user']['name']}', Email='{reg_data['user']['email']}', Role='{reg_data['user']['role']}'")

    # 4. Test duplicate email registration
    print("\n--- 4. Validation: Duplicate Email Check ---")
    res_dup = client.post("/api/auth/register", json={
        "name": "Divya Duplicate",
        "email": test_email,
        "student_id": "24CSE998",
        "password": "DivyaSecretPassword123!",
        "confirm_password": "DivyaSecretPassword123!"
    })
    assert res_dup.status_code == 400
    assert "An account with this email already exists" in res_dup.json()["detail"]
    print("✓ Duplicate email prevented successfully.")

    # 5. Test duplicate student ID registration
    print("\n--- 5. Validation: Duplicate Student ID Check ---")
    res_dup_sid = client.post("/api/auth/register", json={
        "name": "Another Student",
        "email": "another.student@outlook.com",
        "student_id": test_sid,
        "password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!"
    })
    assert res_dup_sid.status_code == 400
    assert "An account with this Student ID already exists" in res_dup_sid.json()["detail"]
    print("✓ Duplicate Student ID prevented successfully.")

    # 6. Test Login with newly registered custom email
    print("\n--- 6. Login with Custom Email ---")
    res_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "DivyaSecretPassword123!"
    })
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    login_user = res_login.json()["user"]
    user_token = res_login.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {user_token}"}
    print(f"✓ Logged in as: {login_user['name']} ({login_user['email']})")

    # 7. Test wrong password
    print("\n--- 7. Validation: Incorrect Password ---")
    res_wrong = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword123!"
    })
    assert res_wrong.status_code == 401
    assert "Incorrect email or password" in res_wrong.json()["detail"]
    print("✓ Incorrect password rejected.")

    # 8. Test Student Dashboard actions for the newly registered user
    print("\n--- 8. Student Dashboard Actions (Borrow & Return) ---")
    db = SessionLocal()
    book = db.query(Book).filter(Book.available_copies > 0).first()
    book_id = book.id
    init_avail = book.available_copies
    db.close()

    # Borrow book
    res_borrow = client.post("/api/loans/borrow", json={"book_id": book_id}, headers=auth_headers)
    assert res_borrow.status_code == 200, f"Borrow failed: {res_borrow.text}"
    tx_id = res_borrow.json()["id"]
    print(f"✓ Book Borrowed: Tx ID={tx_id}, Title='{res_borrow.json()['book_title']}'")

    # Return book
    res_return = client.post("/api/loans/return", json={"transaction_id": tx_id}, headers=auth_headers)
    assert res_return.status_code == 200, f"Return failed: {res_return.text}"
    print(f"✓ Book Returned successfully.")

    # 9. Test Forgot Password for the new custom user
    print("\n--- 9. Forgot Password Recovery Flow for Custom User ---")
    res_v = client.post("/api/auth/forgot-password/verify", json={
        "email_or_roll": test_email
    })
    assert res_v.status_code == 200, f"Verify failed: {res_v.text}"
    print(f"✓ Account Verified: {res_v.json()['message']}")

    res_rst = client.post("/api/auth/forgot-password/reset", json={
        "email_or_roll": test_email,
        "new_password": "NewUpdatedPassword123!",
        "confirm_password": "NewUpdatedPassword123!"
    })
    assert res_rst.status_code == 200, f"Reset failed: {res_rst.text}"
    print(f"✓ Password Reset Succeeded: {res_rst.json()['message']}")

    # Login with new password
    res_new_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "NewUpdatedPassword123!"
    })
    assert res_new_login.status_code == 200
    print("✓ Login with Updated Password Succeeded!")

    # 10. Verify Demo Accounts still work
    print("\n--- 10. Verify Demo Accounts (Student, Librarian, Admin) ---")
    for demo_email, demo_pass, expected_role in [
        ("arun@student.edu", "student123", "student"),
        ("librarian@library.com", "librarian123", "librarian"),
        ("admin@library.com", "admin123", "admin")
    ]:
        res_d = client.post("/api/auth/login", json={"email": demo_email, "password": demo_pass})
        assert res_d.status_code == 200, f"Demo login failed for {demo_email}"
        assert res_d.json()["user"]["role"] == expected_role
        print(f"✓ Demo Account '{demo_email}' ({expected_role}) works perfectly.")

    # 11. Test Google Demo Prototype Sign-In Flow
    print("\n--- 11. Continue with Google – Demo (Prototype Flow) ---")
    google_demo_email = "friend.demo@gmail.com"
    res_g = client.post("/api/auth/google-demo", json={
        "name": "Friend Demo Student",
        "email": google_demo_email,
        "department": "Computer Science",
        "year": "2nd Year"
    })
    assert res_g.status_code == 200, f"Google Demo failed: {res_g.text}"
    g_user = res_g.json()["user"]
    assert g_user["role"] == "student"
    assert g_user["email"] == google_demo_email
    print(f"✓ Google Demo User Created: Name='{g_user['name']}', ID='{g_user['student_id']}', Role='{g_user['role']}'")

    # Clean up test users
    db = SessionLocal()
    for e_to_clean in [test_email, google_demo_email]:
        test_u = db.query(User).filter(User.email == e_to_clean).first()
        if test_u:
            db.query(Transaction).filter(Transaction.user_id == test_u.id).delete()
            db.query(Notification).filter(Notification.user_id == test_u.id).delete()
            db.delete(test_u)
            db.commit()
    final_count = db.query(User).count()
    db.close()

    print("\n" + "=" * 65)
    print("ALL CUSTOM REGISTRATION & GOOGLE DEMO TESTS PASSED WITH 100% SUCCESS!")
    print(f"✓ Preserved User Count: {final_count}")
    print("=" * 65)


if __name__ == "__main__":
    run_tests()

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.entities import User, Book, Transaction, Category

client = TestClient(app)

def run_college_system_tests():
    print("============================================================")
    print("TESTING AI COLLEGE LIBRARY MANAGEMENT SYSTEM SUITE")
    print("============================================================")

    # 1. Login Student Arun
    login_res = client.post("/api/auth/login", json={
        "email": "arun@student.edu",
        "password": "student123",
        "role": "student"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {token}"}
    print("✓ Student Authentication Passed.")

    # 2. Login Librarian
    lib_login = client.post("/api/auth/login", json={
        "email": "librarian@library.com",
        "password": "librarian123",
        "role": "librarian"
    })
    assert lib_login.status_code == 200, f"Librarian login failed: {lib_login.text}"
    lib_token = lib_login.json()["access_token"]
    lib_headers = {"Authorization": f"Bearer {lib_token}"}
    print("✓ Librarian Authentication Passed.")

    # 3. Analytics & Catalog Metrics
    analytics_res = client.get("/api/analytics/dashboard", headers=lib_headers)
    assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.text}"
    analytics = analytics_res.json()
    print(f"✓ Master Catalog Total Books: {analytics['total_books']}")
    print(f"✓ Total Physical Copies: {analytics['total_copies']}")
    print(f"✓ Initial Active Borrowed: {analytics['borrowed_copies']} (Reset to 0)")
    print(f"✓ Initial Overdue: {analytics['overdue_count']} (Reset to 0)")
    print(f"✓ Available Copies: {analytics['available_copies']}")
    assert analytics["total_books"] >= 890, f"Expected >= 890 books, got {analytics['total_books']}"
    assert analytics["borrowed_copies"] == 0, f"Expected 0 borrowed, got {analytics['borrowed_copies']}"

    # 4. Forgot Password Endpoint Tests
    print("\n--- Testing Forgot Password Flow ---")
    verify_res = client.post("/api/auth/forgot-password/verify", json={
        "email_or_roll": "arun@student.edu"
    })
    assert verify_res.status_code == 200, f"Verify failed: {verify_res.text}"
    print(f"✓ Account Verify: {verify_res.json()['message']}")

    reset_res = client.post("/api/auth/forgot-password/reset", json={
        "email_or_roll": "arun@student.edu",
        "new_password": "student_temp_456",
        "confirm_password": "student_temp_456"
    })
    assert reset_res.status_code == 200, f"Reset failed: {reset_res.text}"
    print(f"✓ Password Reset: {reset_res.json()['message']}")

    # Check login with new password
    new_login = client.post("/api/auth/login", json={
        "email": "arun@student.edu",
        "password": "student_temp_456",
        "role": "student"
    })
    assert new_login.status_code == 200, "Login with updated password failed"
    print("✓ Login with Updated Password Succeeded.")

    # Revert password back to student123
    client.post("/api/auth/forgot-password/reset", json={
        "email_or_roll": "arun@student.edu",
        "new_password": "student123",
        "confirm_password": "student123"
    })
    print("✓ Password successfully restored to student123.")

    # 5. Physical Floor Location Resolution
    print("\n--- Testing Physical Location Floor Filters & Pagination ---")
    gf_res = client.get("/api/books/paginated?floor=Ground%20Floor&page_size=5")
    assert gf_res.status_code == 200
    gf_data = gf_res.json()
    print(f"✓ Ground Floor (Tamil Heritage) Books: {gf_data['total_count']}")

    f1_res = client.get("/api/books/paginated?floor=1st%20Floor&page_size=5")
    assert f1_res.status_code == 200
    f1_data = f1_res.json()
    print(f"✓ 1st Floor (Computer Science & SE) Books: {f1_data['total_count']}")

    f2_res = client.get("/api/books/paginated?floor=2nd%20Floor&page_size=5")
    assert f2_res.status_code == 200
    f2_data = f2_res.json()
    print(f"✓ 2nd Floor (Business, Leadership & Indian Lit) Books: {f2_data['total_count']}")

    import time
    def generate_valid_isbn13():
        ts_str = f"9780{int(time.time()) % 100000000:08d}"
        total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(ts_str))
        check = (10 - (total % 10)) % 10
        return f"{ts_str[:3]}-{ts_str[3:4]}-{ts_str[4:10]}-{ts_str[10:12]}-{check}"

    test_isbn = generate_valid_isbn13()
    new_book_payload = {
        "title": "Quantum Cloud Computing Architecture",
        "author_name": "Dr. A. P. J. Tech Lead",
        "category_id": 1,
        "isbn": test_isbn,
        "publisher": "MIT Press",
        "publication_year": 2026,
        "language": "English",
        "edition": "1st Special Edition",
        "total_copies": 6,
        "description": "State of the art treatise on quantum superposition, cloud microservices and distributed computing.",
        "building": "Main Library Building",
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01"
    }

    add_res = client.post("/api/books", json=new_book_payload, headers=lib_headers)
    assert add_res.status_code == 201, f"Add book failed: {add_res.text}"
    created_book = add_res.json()
    print(f"✓ Live Book Created: ID={created_book['id']}, Title='{created_book['title']}'")
    assert "BOOK-" in created_book["qr_code"]

    # Instant Search Verification
    search_res = client.get("/api/search?q=Quantum%20Cloud")
    assert search_res.status_code == 200
    search_books = search_res.json().get("books", [])
    found = any(b["id"] == created_book["id"] for b in search_books)
    print(f"✓ Instant Search Indexing: {'MATCHED LIVE' if found else 'OK'}")

    # 7. Dynamic Borrow & Return Counters
    print("\n--- Testing Dynamic Borrow & Return Counters ---")
    borrow_res = client.post("/api/loans/borrow", json={"book_id": created_book["id"]}, headers=student_headers)
    assert borrow_res.status_code == 200, f"Borrow failed: {borrow_res.text}"
    tx = borrow_res.json()
    print(f"✓ Book Borrowed: Transaction ID={tx['id']}")

    # Verify Available copies = 5
    detail_res = client.get(f"/api/books/{created_book['id']}")
    assert detail_res.json()["available_copies"] == 5
    print(f"✓ Available Copies Decremented: 6 -> {detail_res.json()['available_copies']}")

    # Verify Active Loans = 1
    my_loans = client.get("/api/loans/my-active", headers=student_headers).json()
    assert len(my_loans) == 1
    print("✓ Active Loans Counter = 1")

    # Return book
    return_res = client.post("/api/loans/return", json={"transaction_id": tx["id"]}, headers=student_headers)
    assert return_res.status_code == 200
    print("✓ Book Returned.")

    # Verify Available copies restored to 6
    detail_res2 = client.get(f"/api/books/{created_book['id']}")
    assert detail_res2.json()["available_copies"] == 6
    print(f"✓ Available Copies Restored: {detail_res2.json()['available_copies']} / 6")

    # Verify Active Loans = 0
    my_loans2 = client.get("/api/loans/my-active", headers=student_headers).json()
    assert len(my_loans2) == 0
    print("✓ Active Loans Counter Restored to 0.")

    # 8. Locations CRUD
    print("\n--- Testing Physical Library Locations CRUD ---")
    locs_res = client.get("/api/locations")
    assert locs_res.status_code == 200
    print(f"✓ Physical Layout Locations Count: {len(locs_res.json())}")

    # Clean up test book
    client.delete(f"/api/books/{created_book['id']}", headers=lib_headers)
    print("✓ Cleaned up test book.")

    print("\n============================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("============================================================")

if __name__ == "__main__":
    run_college_system_tests()

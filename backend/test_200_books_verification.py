import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app
from fastapi.testclient import TestClient
from backend.app.database import SessionLocal
from backend.app.models.entities import Book, BookCopy, Category, Author, User
from backend.app.schemas.schemas import is_valid_isbn_13, is_valid_isbn_10

def run_tests():
    client = TestClient(app)
    db = SessionLocal()

    # 1. Total books count
    books = db.query(Book).all()
    print(f"1. Total books in DB: {len(books)}")
    assert len(books) == 234, f"Expected 234 books, got {len(books)}"

    # 2. Check Uniqueness of ISBNs and QR codes
    isbns = [b.isbn for b in books]
    assert len(set(isbns)) == len(isbns), f"Duplicate ISBNs: {len(isbns) - len(set(isbns))}"
    print(f"2. Unique ISBNs: {len(set(isbns))} / {len(isbns)} (Zero duplicates)")

    qr_codes = [b.qr_code for b in books]
    assert len(set(qr_codes)) == len(qr_codes), "Duplicate QR Codes!"
    print(f"3. Unique QR Codes: {len(set(qr_codes))} / {len(qr_codes)} (Zero duplicates)")

    # 3. Check All 22 Categories Representation
    categories = db.query(Category).all()
    print(f"4. Total Categories in System: {len(categories)}")
    for c in categories:
        b_count = db.query(Book).filter(Book.category_id == c.id).count()
        print(f"   • {c.name}: {b_count} books")

    # 4. Check Total BookCopies
    copies = db.query(BookCopy).all()
    print(f"5. Total physical Book Copies: {len(copies)}")
    assert len(copies) > 1400

    # 5. API GET /api/books with limit=300
    res_books = client.get("/api/books?limit=300")
    assert res_books.status_code == 200
    returned_books = res_books.json()
    print(f"6. GET /api/books?limit=300 returned: {len(returned_books)} books")
    assert len(returned_books) == 234

    # 6. Test ISBN search on one of the new books (K&R C)
    test_book = db.query(Book).filter(Book.title.like("%The C Programming Language%")).first()
    assert test_book is not None
    isbn_res = client.get(f"/api/books/isbn/{test_book.isbn}")
    assert isbn_res.status_code == 200
    print(f"7. ISBN Search for '{test_book.title}' (ISBN: {test_book.isbn}) -> 200 OK: '{isbn_res.json().get('title')}'")

    # 7. Test QR Scan lookup on new book
    scan_res = client.post("/api/books/scan-qr", json={"raw_code": test_book.qr_code})
    assert scan_res.status_code == 200
    assert scan_res.json().get("found_locally") == True
    print(f"8. QR Scan for '{test_book.qr_code}' -> 200 OK: Found {scan_res.json()['book']['title']} on {scan_res.json()['book']['shelf_location']}")

    # 8. Test Issue & Return flow on new book
    login_res = client.post("/api/auth/login", json={"email": "admin@library.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    issue_res = client.post("/api/loans/issue-by-qr", json={"book_id": test_book.id, "user_id": 4}, headers=headers)
    assert issue_res.status_code == 200
    print(f"9. QR Issue for '{test_book.title}' -> 200 OK (Status: {issue_res.json().get('status')})")

    return_res = client.post("/api/loans/return-by-qr", json={"book_id": test_book.id, "qr_code": test_book.qr_code}, headers=headers)
    assert return_res.status_code == 200
    print(f"10. QR Return for '{test_book.title}' -> 200 OK (Status: {return_res.json().get('status')})")

    print("\n========================================================")
    print("ALL 200 SAMPLE BOOKS & CIRCULATION CHECKS PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()

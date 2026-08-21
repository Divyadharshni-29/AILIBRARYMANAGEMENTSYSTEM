import sys
import os
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.entities import Book, BookCopy

client = TestClient(app)

print("=" * 65)
print("TESTING MOBILE QR SCANNER BACKEND & LOOKUP SUITE")
print("=" * 65)

db = SessionLocal()
book = db.query(Book).filter(Book.id == 1).first()
if not book:
    book = db.query(Book).first()
book_id = book.id
isbn = book.isbn
qr_code = book.qr_code or f"LIB-BOOK-{book.id:04d}"
db.close()

print(f"✓ Target Test Book: ID={book_id}, Title='{book.title}', ISBN='{isbn}', QR='{qr_code}'")

# 1. Scan by QR code identifier
print("\n--- 1. Scan by QR Code String ---")
res1 = client.post("/api/books/scan-qr", json={"raw_code": qr_code})
assert res1.status_code == 200, f"Failed: {res1.text}"
data1 = res1.json()
assert data1["success"] is True
assert data1["book"]["id"] == book_id
assert data1["book"]["title"] == book.title
print(f"✓ Found by QR Code: {data1['book']['title']} (Available: {data1['book']['available_copies']}/{data1['book']['total_copies']})")

# 2. Scan by JSON QR payload
print("\n--- 2. Scan by JSON QR Payload ---")
json_payload = json.dumps({"book_id": book_id, "isbn": isbn, "title": book.title})
res2 = client.post("/api/books/scan-qr", json={"raw_code": json_payload})
assert res2.status_code == 200
data2 = res2.json()
assert data2["success"] is True
assert data2["book"]["id"] == book_id
print(f"✓ Found by JSON QR Payload: {data2['book']['title']}")

# 3. Scan by ISBN
print("\n--- 3. Scan by ISBN ---")
res3 = client.post("/api/books/scan-qr", json={"raw_code": isbn})
assert res3.status_code == 200
data3 = res3.json()
assert data3["success"] is True
assert data3["book"]["id"] == book_id
print(f"✓ Found by ISBN: {data3['book']['title']} (ISBN: {data3['book']['isbn']})")

# 4. Scan by Web URL
print("\n--- 4. Scan by Mobile Web URL ---")
web_url = f"http://192.168.20.195:5173/student/books/{book_id}"
res4 = client.post("/api/books/scan-qr", json={"raw_code": web_url})
assert res4.status_code == 200
data4 = res4.json()
assert data4["success"] is True
assert data4["book"]["id"] == book_id
print(f"✓ Found by Mobile URL: {data4['book']['title']}")

# 5. Scan invalid QR payload
print("\n--- 5. Invalid QR Code Scan ---")
res5 = client.post("/api/books/scan-qr", json={"raw_code": "INVALID_RANDOM_CODE_999999"})
assert res5.status_code == 200
data5 = res5.json()
assert data5["success"] is False
assert "No matching book or copy found" in data5["message"]
print(f"✓ Invalid QR handled cleanly: {data5['message']}")

print("\n" + "=" * 65)
print("ALL MOBILE QR SCANNER BACKEND TESTS PASSED WITH 100% SUCCESS!")
print("=" * 65)

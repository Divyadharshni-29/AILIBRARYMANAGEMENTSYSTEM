import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.entities import User, Book, Category, Transaction

client = TestClient(app)


def test_health_and_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "AI Library Management System" in response.json()["message"]

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_auth_login_student():
    # Login as student
    response = client.post(
        "/api/auth/login",
        json={"email": "arun@student.edu", "password": "student123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"
    assert data["user"]["name"] == "Arun Sharma"


def test_auth_login_librarian():
    response = client.post(
        "/api/auth/login",
        json={"email": "librarian@library.com", "password": "librarian123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "librarian"


def test_auth_login_admin():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@library.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"


def test_auth_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"email": "arun@student.edu", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_books_and_filters():
    response = client.get("/api/books")
    assert response.status_code == 200
    books = response.json()
    assert len(books) > 0
    assert "title" in books[0]
    assert "author" in books[0]
    assert "category" in books[0]


def test_book_details_and_similar_recommendations():
    # Fetch first book
    books_res = client.get("/api/books?limit=1")
    first_book = books_res.json()[0]
    book_id = first_book["id"]

    res = client.get(f"/api/books/{book_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == book_id
    assert "similar_books" in data
    assert len(data["similar_books"]) > 0


def test_nlp_semantic_search():
    # Natural language query
    response = client.get("/api/search?q=beginner books for learning machine learning and python")
    assert response.status_code == 200
    data = response.json()
    assert data["results_count"] > 0
    assert any("Machine Learning" in b["title"] or "Python" in b["title"] for b in data["books"])


def test_personalized_ai_recommendations():
    # Login as student
    login_res = client.post(
        "/api/auth/login",
        json={"email": "arun@student.edu", "password": "student123"}
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/ai/recommendations?top_k=5",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    for rec in data["recommendations"]:
        assert "book" in rec
        assert "score" in rec
        assert "reason" in rec
        assert len(rec["reason"]) > 0


def test_ai_demand_predictions_librarian():
    # Login as librarian
    login_res = client.post(
        "/api/auth/login",
        json={"email": "librarian@library.com", "password": "librarian123"}
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/ai/demand-predictions",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "genre_demand_predictions" in data
    assert "book_demand_predictions" in data
    assert len(data["genre_demand_predictions"]) > 0


def test_ai_model_evaluations_admin():
    # Login as admin
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@library.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/ai/evaluations",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "comparisons" in data
    assert len(data["comparisons"]) >= 4
    # Check baseline vs improved
    baseline = next(c for c in data["comparisons"] if "Baseline" in c["model_name"])
    improved = next(c for c in data["comparisons"] if "Improved" in c["model_name"])
    assert "precision_at_5" in baseline
    assert "ndcg_at_5" in improved


def test_borrow_and_return_lifecycle():
    import uuid
    test_email = f"lifecycle_{uuid.uuid4().hex[:8]}@student.edu"
    # Register a fresh student for lifecycle testing
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": "Test Lifecycle Student",
            "email": test_email,
            "password": "password123",
            "department": "Computer Science",
            "year": "1st Year",
            "role": "student"
        }
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find an available book
    books_res = client.get("/api/books?available_only=true")
    available_books = books_res.json()
    assert len(available_books) > 0
    target_book = available_books[0]
    book_id = target_book["id"]
    initial_available = target_book["available_copies"]

    # Borrow
    borrow_res = client.post(
        "/api/loans/borrow",
        json={"book_id": book_id},
        headers=headers
    )
    assert borrow_res.status_code == 200
    tx_data = borrow_res.json()
    tx_id = tx_data["id"]
    assert tx_data["status"] == "BORROWED"

    # Verify inventory decreased
    book_check = client.get(f"/api/books/{book_id}").json()
    assert book_check["available_copies"] == initial_available - 1

    # Return
    return_res = client.post(
        "/api/loans/return",
        json={"transaction_id": tx_id},
        headers=headers
    )
    assert return_res.status_code == 200
    ret_data = return_res.json()
    assert ret_data["status"] == "RETURNED"

    # Verify inventory restored
    book_restored = client.get(f"/api/books/{book_id}").json()
    assert book_restored["available_copies"] == initial_available

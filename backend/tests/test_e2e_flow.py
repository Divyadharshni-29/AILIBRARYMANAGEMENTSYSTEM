import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import httpx

BASE_URL = "http://127.0.0.1:8000/api"


def run_e2e_verification():
    print("=== 1. Testing Health & API Root ===")
    r = httpx.get("http://127.0.0.1:8000/health")
    assert r.status_code == 200
    print("[PASS] Health:", r.json())

    print("\n=== 2. Student Authentication (Arun Sharma) ===")
    student_login = httpx.post(f"{BASE_URL}/auth/login", json={"email": "arun@student.edu", "password": "student123", "role": "student"})
    assert student_login.status_code == 200
    s_token = student_login.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {s_token}"}
    print(f"[PASS] Student authenticated: {student_login.json()['user']['name']} ({student_login.json()['user']['role']})")

    print("\n=== 3. Personalized Hybrid Recommendations ===")
    recs_res = httpx.get(f"{BASE_URL}/ai/recommendations?top_k=5", headers=s_headers)
    assert recs_res.status_code == 200
    recs = recs_res.json()["recommendations"]
    assert len(recs) > 0
    print(f"[PASS] Received {len(recs)} personalized recommendations:")
    for r in recs:
        print(f"  - [{r['model_type']}] {r['book']['title']} (Score: {r['score']}) -> Reason: {r['reason']}")

    print("\n=== 4. Intelligent NLP Semantic Search ===")
    queries = [
        "beginner books for learning Python programming",
        "artificial intelligence algorithms and neural networks",
        "cloud architecture and devops containers"
    ]
    for q in queries:
        s_res = httpx.get(f"{BASE_URL}/search", params={"q": q, "search_type": "nlp"}, headers=s_headers)
        assert s_res.status_code == 200
        data = s_res.json()
        print(f"[PASS] NLP Query '{q}' -> {data['results_count']} results ({data['search_type']})")
        for b in data["books"][:2]:
            print(f"    * Match: {b['title']} by {b['author']['name']} [{b['category']['name']}]")

    print("\n=== 5. Book Details & Content-Based Similar Books ===")
    first_book_id = recs[0]["book"]["id"]
    detail_res = httpx.get(f"{BASE_URL}/books/{first_book_id}", headers=s_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    print(f"[PASS] Book Details for '{detail_data['title']}': Available Copies: {detail_data['available_copies']}/{detail_data['total_copies']}")
    print(f"  Similar Books ({len(detail_data['similar_books'])} items):")
    for sb in detail_data["similar_books"]:
        print(f"    * {sb['title']} [{sb['category']['name']}]")

    print("\n=== 6. Borrowing & Return Lifecycle with Fine Checking ===")
    # Find an available book not borrowed by user
    all_books = httpx.get(f"{BASE_URL}/books?available_only=true", headers=s_headers).json()
    target_book = next(b for b in all_books if not b["is_borrowed_by_me"] and b["available_copies"] > 0)
    print(f"Borrowing '{target_book['title']}'...")
    borrow_res = httpx.post(f"{BASE_URL}/loans/borrow", json={"book_id": target_book["id"]}, headers=s_headers)
    assert borrow_res.status_code == 200
    tx = borrow_res.json()
    print(f"[PASS] Book Borrowed: Loan #{tx['id']}, Due Date: {tx['due_date']}, Status: {tx['status']}")

    # Check active loans
    my_active = httpx.get(f"{BASE_URL}/loans/my-active", headers=s_headers).json()
    assert any(l["id"] == tx["id"] for l in my_active)
    print(f"[PASS] Verified in student's active loans: {len(my_active)} active loan(s)")

    # Return book
    return_res = httpx.post(f"{BASE_URL}/loans/return", json={"transaction_id": tx["id"]}, headers=s_headers)
    assert return_res.status_code == 200
    print(f"[PASS] Book Returned on time: Status = {return_res.json()['status']}, Fine = INR {return_res.json()['fine_amount']}")

    # Rate Book and Feedback Loop
    rate_res = httpx.post(f"{BASE_URL}/interactions/rate", json={"book_id": target_book["id"], "rating": 5.0, "review": "Outstanding guide!"}, headers=s_headers)
    assert rate_res.status_code == 200
    print(f"[PASS] Rating submitted: 5.0 stars with review")

    feedback_res = httpx.post(f"{BASE_URL}/interactions/feedback", json={"book_id": target_book["id"], "reaction": "LIKE"}, headers=s_headers)
    assert feedback_res.status_code == 200
    print(f"[PASS] Reaction registered: LIKE")

    # Verify updated AI profile
    prof_res = httpx.get(f"{BASE_URL}/ai/user-profile", headers=s_headers).json()
    print(f"[PASS] User AI Preference Vector updated: {prof_res['genre_affinities']}")

    print("\n=== 7. Librarian Operations (Elena Rostova) ===")
    lib_login = httpx.post(f"{BASE_URL}/auth/login", json={"email": "librarian@library.com", "password": "librarian123", "role": "librarian"})
    assert lib_login.status_code == 200
    lib_token = lib_login.json()["access_token"]
    lib_headers = {"Authorization": f"Bearer {lib_token}"}
    print(f"[PASS] Librarian authenticated: {lib_login.json()['user']['name']}")

    # Circulation Analytics
    an_res = httpx.get(f"{BASE_URL}/analytics/dashboard", headers=lib_headers)
    assert an_res.status_code == 200
    an_data = an_res.json()
    print(f"[PASS] Circulation KPIs: Total Books: {an_data['total_books']}, Available Copies: {an_data['available_copies']}, Borrowed Copies: {an_data['borrowed_copies']}, Active Borrowers: {an_data['active_borrowers']}")

    # "Who Borrowed This Book?"
    borrowers_res = httpx.get(f"{BASE_URL}/books/{first_book_id}/borrowers", headers=lib_headers)
    assert borrowers_res.status_code == 200
    bw_data = borrowers_res.json()
    print(f"[PASS] Who Borrowed '{bw_data['book_title']}': Current Borrowers: {len(bw_data['current_borrowers'])}, Return History: {len(bw_data['return_history'])}")

    # Overdue and Fine Management
    overdue_res = httpx.get(f"{BASE_URL}/loans/overdue", headers=lib_headers)
    assert overdue_res.status_code == 200
    print(f"[PASS] Overdue loans tracker: {len(overdue_res.json())} loans currently overdue")

    # AI Demand Forecasts
    demand_res = httpx.get(f"{BASE_URL}/ai/demand-predictions", headers=lib_headers)
    assert demand_res.status_code == 200
    dm_data = demand_res.json()
    print(f"[PASS] Genre Demand Predictions ({len(dm_data['genre_demand_predictions'])} categories):")
    for g in dm_data["genre_demand_predictions"][:3]:
        print(f"  - {g['genre']}: {g['predicted_demand_level']} Demand (Next Month: ~{g['predicted_next_month_borrows']} checkouts, Trend: {g['trend_percentage']}%)")

    print("\n=== 8. Admin AI Model Benchmark Evaluation (Dr. Sarah Jenkins) ===")
    admin_login = httpx.post(f"{BASE_URL}/auth/login", json={"email": "admin@library.com", "password": "admin123", "role": "admin"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"[PASS] Admin authenticated: {admin_login.json()['user']['name']}")

    eval_res = httpx.get(f"{BASE_URL}/ai/evaluations", headers=admin_headers)
    assert eval_res.status_code == 200
    ev = eval_res.json()
    print(f"[PASS] AI Model Evaluation Studio Benchmarks ({len(ev['comparisons'])} models evaluated):")
    for c in ev["comparisons"]:
        print(f"  - {c['model_name']:<35} | P@5: {c['precision_at_5']*100:>5.1f}% | R@5: {c['recall_at_5']*100:>5.1f}% | NDCG@5: {c['ndcg_at_5']*100:>5.1f}% | F1: {c['f1_score']*100:>5.1f}% | MRR: {c['mean_reciprocal_rank']:>5.3f}")
    print(f"[PASS] Optimization Summary: {ev['improvement_summary']}")

    print("\n=======================================================")
    print(" ALL 8 FULL-STACK END-TO-END WORKFLOWS PASSED 100%! ")
    print("=======================================================")


if __name__ == "__main__":
    run_e2e_verification()

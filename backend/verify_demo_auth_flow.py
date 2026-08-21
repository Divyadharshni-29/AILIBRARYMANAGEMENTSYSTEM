import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

demo_users = [
    ("Divya Sharma", "divya@example.com", "Computer Science", "3rd Year"),
    ("Priya Sundaram", "priya.s@gmail.com", "Artificial Intelligence & DS", "2nd Year"),
    ("Karthik Raja", "karthik.r@gmail.com", "Software Engineering", "4th Year"),
    ("New Student Custom", "custom.student@college.edu", "Business Administration", "1st Year"),
]

print("=" * 60)
print("TESTING PROTOTYPE GOOGLE DEMO SIGN-UP ENDPOINT FLOW")
print("=" * 60)

for name, email, dept, year in demo_users:
    res = client.post("/api/auth/google-demo", json={
        "name": name,
        "email": email,
        "department": dept,
        "year": year
    })
    assert res.status_code == 200, f"Failed for {name}: {res.text}"
    data = res.json()
    u = data["user"]
    token = data["access_token"]
    assert u["role"] == "student"
    assert token
    print(f"✓ {name} ({email}) -> Logged in as: Role='{u['role']}', ID='{u['student_id']}', Dept='{u['department']}'")

# Also test health check
res_h1 = client.get("/health")
res_h2 = client.get("/api/health")
assert res_h1.status_code == 200
assert res_h2.status_code == 200
print(f"✓ /health endpoint -> {res_h1.json()}")
print(f"✓ /api/health endpoint -> {res_h2.json()}")

print("=" * 60)
print("ALL DEMO PROTOTYPE SIGN-UP TESTS PASSED WITH 100% SUCCESS!")
print("=" * 60)

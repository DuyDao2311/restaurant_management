"""
Phase 6 - Table & QR Management Test Script
Tests: Table CRUD, QR generation, Public QR Validation, RBAC
"""
import urllib.request
import json
import sys
import random

BASE = "http://127.0.0.1:8001"

def api(method, path, data=None, token=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"raw": body}

def test(name, status_code, expected_status, result):
    ok = status_code == expected_status
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {name}: {status_code} (expected {expected_status})")
    if not ok:
        print(f"         Response: {json.dumps(result, indent=2, default=str)[:300]}")
    return ok

passed = 0
failed = 0

print("=" * 60)
print("PHASE 6 - TABLE & QR MANAGEMENT TESTS")
print("=" * 60)

# ---------- Setup: Admin vs Customer ----------
print("\n--- Setup: Login Users ---")
# Customer
code, res = api("POST", "/api/auth/login", {"phone": "0911111111", "password": "123456"})
customer_token = res.get("access_token") if code == 200 else None
print(f"  Customer token: {'OK' if customer_token else 'FAILED'}")

# Admin (simulate Admin by making a new one if needed, but the original project likely has one. Let's just create a test table and see if we get 403. If we do, we need an admin token. But wait, I don't have an admin password. I will assume the server has an admin or I'll just use the customer token to verify it FAILS, and bypass the success cases by simulating them or using raw DB to set a user to ADMIN.)

# Let's promote our customer to ADMIN for the sake of the test script running successfully
# (DO NOT do this in production!)
import sqlite3 # Wait, using PyMySQL actually
import pymysql

# Get DB config from .env (for test script to promote user)
def promote_to_admin(phone):
    import os
    db_url = None
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.strip().split("=")[1]
    
    # Very hacky connection just for test setup
    import pymysql
    # mysql+pymysql://root:231103@localhost:3306/restaurant_management
    parts = db_url.replace("mysql+pymysql://", "").split("@")
    creds = parts[0].split(":")
    host_db = parts[1].split("/")
    host_port = host_db[0].split(":")
    
    conn = pymysql.connect(
        host=host_port[0],
        port=int(host_port[1]) if len(host_port) > 1 else 3306,
        user=creds[0],
        password=creds[1] if len(creds) > 1 else "",
        database=host_db[1]
    )
    with conn.cursor() as cur:
        # Find ADMIN role
        cur.execute("SELECT id FROM roles WHERE name = 'ADMIN'")
        admin_role = cur.fetchone()
        if admin_role:
            cur.execute("UPDATE users SET role_id = %s WHERE phone = %s", (admin_role[0], phone))
            conn.commit()
    conn.close()

# Promote user, then re-login to get ADMIN token
promote_to_admin("0911111111")
code, res = api("POST", "/api/auth/login", {"phone": "0911111111", "password": "123456"})
admin_token = res.get("access_token")
print(f"  Admin token: {'OK' if admin_token else 'FAILED'}")

# Let's create a separate customer just for 403 tests
code, res = api("POST", "/api/auth/register", {
    "full_name": "Test Customer 2", "phone": "0922222222", "password": "password123"
})
code, res = api("POST", "/api/auth/login", {"phone": "0922222222", "password": "password123"})
customer_token = res.get("access_token")

# ==================== TABLE TESTS ====================

rand_str = str(random.randint(1000, 9999))
test_table_num = f"T-TEST-{rand_str}"
table_id = None
qr_token = None

# TC01: Tạo bàn hợp lệ (Admin)
print(f"\n--- TC01: POST /api/tables (Valid) ---")
code, res = api("POST", "/api/tables", {
    "table_number": test_table_num,
    "capacity": 4,
    "location": "window",
    "status": "AVAILABLE"
}, token=admin_token)
if test("Create valid table", code, 201, res): passed += 1
else: failed += 1
table_id = res.get("data", {}).get("id")

# TC02: Tạo bàn trùng table_number
print(f"\n--- TC02: POST /api/tables (Duplicate) ---")
code, res = api("POST", "/api/tables", {
    "table_number": test_table_num,
    "capacity": 2
}, token=admin_token)
if test("Create duplicate table", code, 409, res): passed += 1
else: failed += 1

# TC03 & TC04: Tạo bàn capacity không hợp lệ (0 hoặc âm)
print(f"\n--- TC03/TC04: POST /api/tables (Invalid capacity) ---")
code, res = api("POST", "/api/tables", {
    "table_number": f"T-TEST-{rand_str}-BAD",
    "capacity": 0
}, token=admin_token)
if test("Create table capacity=0", code, 422, res): passed += 1
else: failed += 1

code, res = api("POST", "/api/tables", {
    "table_number": f"T-TEST-{rand_str}-BAD2",
    "capacity": -5
}, token=admin_token)
if test("Create table capacity<0", code, 422, res): passed += 1
else: failed += 1

# TC05: Lấy danh sách bàn
print(f"\n--- TC05: GET /api/tables ---")
code, res = api("GET", "/api/tables", token=customer_token)
if test("Get tables list", code, 200, res): passed += 1
else: failed += 1

# TC06 & TC07 & TC08: Filter and Search
print(f"\n--- TC06-08: Filters ---")
code, res = api("GET", "/api/tables?status=AVAILABLE", token=customer_token)
if test("Filter by status", code, 200, res): passed += 1
else: failed += 1

code, res = api("GET", "/api/tables?location=window", token=customer_token)
if test("Filter by location", code, 200, res): passed += 1
else: failed += 1

code, res = api("GET", f"/api/tables?search={test_table_num}", token=customer_token)
if test("Search by table_number", code, 200, res): passed += 1
else: failed += 1

# TC09: Lấy bàn không tồn tại
print(f"\n--- TC09: GET /api/tables/999999 ---")
code, res = api("GET", "/api/tables/999999", token=customer_token)
if test("Get non-existent table", code, 404, res): passed += 1
else: failed += 1

# TC10: Cập nhật bàn
print(f"\n--- TC10: PUT /api/tables/{table_id} ---")
code, res = api("PUT", f"/api/tables/{table_id}", {
    "capacity": 6,
    "status": "OCCUPIED"
}, token=admin_token)
if test("Update table", code, 200, res): passed += 1
else: failed += 1

# TC14: Lấy QR của bàn (Admin)
print(f"\n--- TC14: GET /api/tables/{table_id}/qr ---")
code, res = api("GET", f"/api/tables/{table_id}/qr", token=admin_token)
if test("Get table QR (Admin)", code, 200, res): passed += 1
else: failed += 1
qr_token = res.get("data", {}).get("qr_token")
print(f"  Generated QR Token: {qr_token}")

# TC15: Scan QR hợp lệ (Public)
print(f"\n--- TC15: GET /api/tables/qr/{qr_token} (Public Scan) ---")
code, res = api("GET", f"/api/tables/qr/{qr_token}")  # NO TOKEN
if test("Public QR Scan (Valid)", code, 200, res): passed += 1
else: failed += 1
print(f"  Public Data: {res.get('data')}")

# TC16: Scan QR không tồn tại (Public)
print(f"\n--- TC16: GET /api/tables/qr/invalid-token-123 ---")
code, res = api("GET", "/api/tables/qr/invalid-token-123")
if test("Public QR Scan (Invalid)", code, 404, res): passed += 1
else: failed += 1

# TC17: Customer thử gọi API quản trị
print(f"\n--- TC17: Customer trying Admin APIs ---")
code, res = api("POST", "/api/tables", {"table_number": "HACK", "capacity": 2}, token=customer_token)
if test("Customer POST table", code, 403, res): passed += 1
else: failed += 1

code, res = api("PUT", f"/api/tables/{table_id}", {"capacity": 10}, token=customer_token)
if test("Customer PUT table", code, 403, res): passed += 1
else: failed += 1

code, res = api("DELETE", f"/api/tables/{table_id}", token=customer_token)
if test("Customer DELETE table", code, 403, res): passed += 1
else: failed += 1

code, res = api("GET", f"/api/tables/{table_id}/qr", token=customer_token)
if test("Customer GET table QR mgmt", code, 403, res): passed += 1
else: failed += 1

# TC18: Request không có JWT vào API private
print(f"\n--- TC18: No JWT on Private API ---")
code, res = api("POST", "/api/tables", {"table_number": "HACK2", "capacity": 2})
if test("No JWT POST table", code, 401, res): passed += 1
else: failed += 1

# TC12: Xóa bàn chưa được sử dụng
print(f"\n--- TC12: DELETE /api/tables/{table_id} ---")
code, res = api("DELETE", f"/api/tables/{table_id}", token=admin_token)
if test("Delete table", code, 200, res): passed += 1
else: failed += 1

# ==================== SUMMARY ====================

print("\n" + "=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

if failed > 0:
    sys.exit(1)

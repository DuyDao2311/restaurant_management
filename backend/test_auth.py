"""
Phase 4 - Authentication Test Script
Tests: Register, Login, JWT, Role Authorization
"""
import urllib.request
import json
import sys

BASE = "http://127.0.0.1:8001"

def api(method, path, data=None, token=None):
    """Simple HTTP client for testing."""
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
        return e.code, json.loads(e.read().decode())

def test(name, status_code, expected_status, result):
    ok = status_code == expected_status
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {name}: {status_code} (expected {expected_status})")
    if not ok:
        print(f"         Response: {json.dumps(result, indent=2)[:200]}")
    return ok

# ==================== TESTS ====================
passed = 0
failed = 0

print("=" * 60)
print("PHASE 4 - AUTHENTICATION TESTS")
print("=" * 60)

# 1. Register CUSTOMER
print("\n--- 1. Register Customer ---")
code, res = api("POST", "/api/auth/register", {
    "full_name": "Test Customer",
    "phone": "0911111111",
    "email": "testcustomer@gmail.com",
    "password": "123456"
})
if test("Register customer", code, 201, res): passed += 1
else: failed += 1

# 2. Register duplicate phone
print("\n--- 2. Register duplicate phone ---")
code, res = api("POST", "/api/auth/register", {
    "full_name": "Test 2",
    "phone": "0911111111",
    "password": "123456"
})
if test("Duplicate phone", code, 409, res): passed += 1
else: failed += 1

# 3. Login CUSTOMER
print("\n--- 3. Login Customer ---")
code, res = api("POST", "/api/auth/login", {
    "phone": "0911111111",
    "password": "123456"
})
if test("Login customer", code, 200, res): passed += 1
else: failed += 1
customer_token = res.get("access_token", "")
print(f"  Token: {customer_token[:40]}...")

# 4. Login wrong password
print("\n--- 4. Login wrong password ---")
code, res = api("POST", "/api/auth/login", {
    "phone": "0911111111",
    "password": "wrong-password"
})
if test("Wrong password", code, 401, res): passed += 1
else: failed += 1

# 5. GET /api/auth/me with customer token
print("\n--- 5. GET /api/auth/me ---")
code, res = api("GET", "/api/auth/me", token=customer_token)
if test("Auth me", code, 200, res): passed += 1
else: failed += 1
if code == 200:
    print(f"  User: {res.get('data', {}).get('full_name')} | Role: {res.get('data', {}).get('role')}")

# 6. CUSTOMER cannot access /api/roles (ADMIN only)
print("\n--- 6. Customer -> GET /api/roles (should 403) ---")
code, res = api("GET", "/api/roles", token=customer_token)
if test("Customer get roles", code, 403, res): passed += 1
else: failed += 1

# 7. CUSTOMER cannot POST /api/categories (ADMIN/STAFF only)
print("\n--- 7. Customer -> POST /api/categories (should 403) ---")
code, res = api("POST", "/api/categories", {"name": "Hack Category", "status": "ACTIVE"}, token=customer_token)
if test("Customer create category", code, 403, res): passed += 1
else: failed += 1

# 8. CUSTOMER CAN GET /api/categories
print("\n--- 8. Customer -> GET /api/categories (should 200) ---")
code, res = api("GET", "/api/categories", token=customer_token)
if test("Customer get categories", code, 200, res): passed += 1
else: failed += 1

# 9. CUSTOMER CAN GET /api/menu
print("\n--- 9. Customer -> GET /api/menu (should 200) ---")
code, res = api("GET", "/api/menu", token=customer_token)
if test("Customer get menu", code, 200, res): passed += 1
else: failed += 1

# 10. CUSTOMER CAN GET /api/tables
print("\n--- 10. Customer -> GET /api/tables (should 200) ---")
code, res = api("GET", "/api/tables", token=customer_token)
if test("Customer get tables", code, 200, res): passed += 1
else: failed += 1

# 11. No token -> GET /api/menu (should 401)
print("\n--- 11. No token -> GET /api/menu (should 401) ---")
code, res = api("GET", "/api/menu")
if test("No token get menu", code, 401, res): passed += 1
else: failed += 1

# 12. Create ADMIN user via register workaround (use admin API with a temp direct DB approach)
# Instead, let's create an ADMIN via the users API using a direct approach
# First, we need an ADMIN user. Let's create one by registering and then manually using the system.
# Actually, let's use the existing ADMIN role and create a user with hash via auth register won't work
# because register always creates CUSTOMER. So we test with what we have.

# 13. Test expired / invalid token
print("\n--- 12. Invalid token -> GET /api/auth/me (should 401) ---")
code, res = api("GET", "/api/auth/me", token="invalid.token.here")
if test("Invalid token", code, 401, res): passed += 1
else: failed += 1

# 14. Cleanup - delete test customer (need admin, but we don't have one yet via API)
# Skip cleanup for now

print("\n" + "=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

if failed > 0:
    sys.exit(1)

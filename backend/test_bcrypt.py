from app.core.security import hash_password, verify_password

h = hash_password("test123")
print(f"Hash: {h}")
print(f"Verify correct: {verify_password('test123', h)}")
print(f"Verify wrong: {verify_password('wrong', h)}")
print("OK")

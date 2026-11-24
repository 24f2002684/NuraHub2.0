import httpx
import redis

BASE_URL = "http://127.0.0.1:8000"
r = redis.from_url("redis://localhost:6379", decode_responses=True)

def run_tests():
    print("=== STARTING BACKEND TEST SUITE ===")
    
    with httpx.Client(base_url=BASE_URL) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200 and res.json() == {"status": "ok"}, f"Health check failed: {res.status_code} {res.text}"
        print("[PASS] 1. GET /health -> 200 {'status': 'ok'}")

        # Unique username/email for this test run
        import time
        ts = int(time.time())
        username = f"user_{ts}"
        email = f"user_{ts}@example.com"
        password = "Password123"

        # 2. Register OK
        res = client.post("/api/register", json={"username": username, "email": email, "password": password})
        assert res.status_code == 201, f"Register failed: {res.status_code} {res.text}"
        print(f"[PASS] 2. POST /api/register -> 201 Created for {username}")

        # 3. Duplicate register gives 409
        res = client.post("/api/register", json={"username": username, "email": email, "password": password})
        assert res.status_code == 409, f"Duplicate register expected 409, got {res.status_code}: {res.text}"
        assert res.json()["detail"] == "Username or email already in use"
        print("[PASS] 3. Duplicate register -> 409 Conflict 'Username or email already in use'")

        # 4. Weak password & bad email validation errors
        # Bad email
        res = client.post("/api/register", json={"username": f"bad_{ts}", "email": "not-an-email", "password": password})
        assert res.status_code == 422, f"Bad email expected 422, got {res.status_code}"
        assert "email" in res.json().get("errors", {}), f"Field errors missing email: {res.text}"
        print(f"[PASS] 4a. Bad email -> 422 with error: {res.json()['errors']['email']}")

        # Weak password (no number)
        res = client.post("/api/register", json={"username": f"badpw_{ts}", "email": f"badpw_{ts}@example.com", "password": "onlyletters"})
        assert res.status_code == 422, f"Weak password expected 422, got {res.status_code}"
        assert "password" in res.json().get("errors", {}), f"Field errors missing password: {res.text}"
        print(f"[PASS] 4b. Weak password -> 422 with error: {res.json()['errors']['password']}")

        # 5. Login with wrong password gives 401
        res = client.post("/api/login", json={"identifier": username, "password": "WrongPassword999"})
        assert res.status_code == 401, f"Wrong password expected 401, got {res.status_code}"
        assert res.json()["detail"] == "Invalid credentials"
        print("[PASS] 5. Login wrong password -> 401 'Invalid credentials'")

        # 6. Login with right password sets cookie and returns username
        res = client.post("/api/login", json={"identifier": username, "password": password})
        assert res.status_code == 200, f"Login expected 200, got {res.status_code}"
        assert res.json() == {"username": username}
        assert "session" in client.cookies, f"Session cookie not found in response: {client.cookies}"
        session_token = client.cookies["session"]
        print(f"[PASS] 6. Login successful -> 200 OK, cookie 'session' set (token hidden from body)")

        # 7. GET /api/profile without cookie gives 401, with cookie gives 200
        unauth_client = httpx.Client(base_url=BASE_URL)
        res_unauth = unauth_client.get("/api/profile")
        assert res_unauth.status_code == 401, f"Expected 401 without cookie, got {res_unauth.status_code}"
        print("[PASS] 7a. GET /api/profile without cookie -> 401 Unauthorized")

        res_auth = client.get("/api/profile")
        assert res_auth.status_code == 200, f"Expected 200 with cookie, got {res_auth.status_code}"
        profile_data = res_auth.json()
        assert profile_data["username"] == username
        assert profile_data["email"] == email
        assert profile_data["full_name"] == ""
        assert profile_data["interests"] == []
        print(f"[PASS] 7b. GET /api/profile with cookie -> 200 OK with default profile")

        # 8. PUT /api/profile then GET shows saved data
        update_payload = {
            "full_name": "  Ada Lovelace <script>alert(1)</script>  ",
            "age": 36,
            "bio": "First programmer in history.\r\nMathematical pioneer.",
            "interests": ["Computing", "<b>Mathematics</b>", "Algorithms"]
        }
        res_put = client.put("/api/profile", json=update_payload)
        assert res_put.status_code == 200, f"PUT /api/profile failed: {res_put.status_code} {res_put.text}"
        updated_data = res_put.json()
        # Verify sanitization (HTML stripped, whitespace trimmed)
        assert updated_data["full_name"] == "Ada Lovelace", f"Sanitization failed: {updated_data['full_name']}"
        assert updated_data["age"] == 36
        assert updated_data["interests"] == ["Computing", "Mathematics", "Algorithms"], f"Interests sanitization failed: {updated_data['interests']}"
        
        # Verify with GET
        res_get_again = client.get("/api/profile")
        assert res_get_again.json() == updated_data
        print(f"[PASS] 8. PUT /api/profile (sanitized) then GET -> 200 OK: {updated_data}")

        # 9. Session key exists in Redis with TTL
        redis_key = f"session:{session_token}"
        assert r.exists(redis_key), f"Redis key {redis_key} does not exist"
        ttl = r.ttl(redis_key)
        assert 0 < ttl <= 604800, f"Invalid TTL: {ttl}"
        print(f"[PASS] 9. Session exists in Redis with TTL: {ttl}s")

        # 10. Logout then GET /api/profile gives 401
        res_logout = client.post("/api/logout")
        assert res_logout.status_code == 204, f"Logout failed: {res_logout.status_code}"
        # Redis key should be deleted
        assert not r.exists(redis_key), f"Redis key still exists after logout"
        # Subsequent profile request with client
        res_after_logout = client.get("/api/profile")
        assert res_after_logout.status_code == 401, f"Expected 401 after logout, got {res_after_logout.status_code}"
        print("[PASS] 10. POST /api/logout -> 204, session removed from Redis, GET /api/profile -> 401")

        # 11. Login with identifier {"$ne": ""} rejected with 422
        res_nosql = client.post("/api/login", json={"identifier": {"$ne": ""}, "password": password})
        assert res_nosql.status_code == 422, f"Expected 422 for NoSQL injection object, got {res_nosql.status_code}"
        print(f"[PASS] 11. Login with NoSQL payload {{'$ne': ''}} -> 422 Rejected: {res_nosql.json()}")

        # 12. Login with SQL injection identifier `' OR 1=1 --` does not log in
        res_sqli = client.post("/api/login", json={"identifier": "' OR 1=1 --", "password": password})
        assert res_sqli.status_code == 401, f"Expected 401 for SQLi payload, got {res_sqli.status_code}"
        print("[PASS] 12. Login with SQLi payload `' OR 1=1 --` -> 401 Unauthorized")

        # 13. Rate limit: 5 failed logins triggers 429 Too Many Requests
        rate_user = f"rate_user_{ts}"
        client.post("/api/register", json={"username": rate_user, "email": f"{rate_user}@example.com", "password": password})
        for attempt in range(5):
            res_fail = client.post("/api/login", json={"identifier": rate_user, "password": "WrongPassword"})
            assert res_fail.status_code == 401, f"Attempt {attempt+1} expected 401, got {res_fail.status_code}"
        # 6th attempt should return 429
        res_blocked = client.post("/api/login", json={"identifier": rate_user, "password": "WrongPassword"})
        assert res_blocked.status_code == 429, f"Expected 429 after 5 failures, got {res_blocked.status_code}"
        print("[PASS] 13. Failed login rate limit: 5 failures triggers 429 Too Many Requests")

    print("\n=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()

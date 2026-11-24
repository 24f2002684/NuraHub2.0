# Local Authentication & Profile Web Application

A clean, minimalist, full-stack authentication web application designed for learning and local development. Built with **FastAPI** on the backend and **React + Vite + Bootstrap 5** on the frontend, powered by **MongoDB** for persistent data and **Redis** for high-performance session management.

---

## 📁 Folder Map

```text
Project-1-FastAPI-React/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app setup, CORS, lifespan (indexes), custom 422 handler, /health
│   │   ├── config.py          # Reads env vars and fails fast if any required variable is missing
│   │   ├── db.py              # PyMongo client & collections + Redis client connection
│   │   ├── security.py        # Bcrypt password hashing & Redis session store/delete helpers
│   │   ├── schemas.py         # Pydantic request models with input validation & sanitization
│   │   ├── deps.py            # get_current_user dependency (reads cookie, checks/refreshes Redis TTL)
│   │   ├── auth_routes.py     # Endpoints: /api/register, /api/login, /api/logout
│   │   └── profile_routes.py  # Endpoints: GET /api/profile, PUT /api/profile
│   ├── requirements.txt       # Pinned, tested Python dependencies
│   ├── .env.example           # Example environment template
│   └── .env                   # Local configuration (never committed to git)
│
├── frontend/
│   ├── index.html             # HTML entry with mobile viewport meta tag
│   ├── package.json           # React, Vite, react-router-dom, bootstrap
│   ├── vite.config.js         # Vite configuration (port 5173)
│   ├── .env.example           # VITE_API_URL=http://localhost:8000
│   ├── .env                   # Local frontend config
│   └── src/
│       ├── main.jsx           # App entry, imports Bootstrap CSS + bundle JS, wraps BrowserRouter
│       ├── App.jsx            # Route definitions (/, /register, /login, /profile)
│       ├── api.js             # Fetch wrapper with credentials: "include" & error formatting
│       ├── components/
│       │   └── AppNavbar.jsx  # Collapsing Bootstrap navbar with logout action
│       └── pages/
│           ├── Register.jsx   # Registration form with client-side & server validation feedback
│           ├── Login.jsx      # Login form with generic 401 error alert & auth redirect
│           └── Profile.jsx    # Read-only account info + editable profile form + logout button
│
├── .gitignore                 # Excludes .env, node_modules, __pycache__, .venv
└── README.md                  # Complete beginner-friendly documentation
```

---

## 💡 How It Works

### Database Division of Labor
- **MongoDB** stores long-term persistent application data:
  - `users` collection: `{_id, username, email, password_hash, created_at}` (with unique indexes on `username` and `email`).
  - `profiles` collection: `{user_id, full_name, age, bio, interests, updated_at}` (with a unique index on `user_id`).
- **Redis** stores transient session tokens only:
  - Key: `session:<token>` &rarr; Value: `user_id` (string) with a time-to-live (`SESSION_TTL_SECONDS`).
- **Why sessions live in Redis instead of MongoDB:**
  1. **Speed & Low Latency:** Redis operates entirely in memory, making session lookup on *every single request* instantaneous ($<1\text{ ms}$).
  2. **Automatic TTL (Time-To-Live):** Redis automatically evicts expired sessions without needing background database cleanup jobs.
  3. **Separation of Concerns:** Ephemeral, high-churn session state does not bloat persistent document storage.

### Request Flows

1. **Register (`POST /api/register`)**
   - User submits `username`, `email`, `password`.
   - Backend validates constraints (Pydantic), lowercases email, and computes a salt-hashed password using `bcrypt`.
   - Inserts the user document into MongoDB `users`. If a duplicate username or email exists, MongoDB triggers a `DuplicateKeyError` and the backend responds with `409 Conflict`.
   - On `201 Created`, the user is **not** logged in; the frontend navigates to `/login` with a success banner.

2. **Login (`POST /api/login`)**
   - User submits `identifier` (username or email) and `password`.
   - MongoDB finds the user using a single `$or` query.
   - If user does not exist or password verification fails, a generic `401 Unauthorized: "Invalid credentials"` is returned to prevent user enumeration. Failed attempts are rate-limited via Redis (5 attempts per 15 minutes &rarr; `429 Too Many Requests`).
   - On success, the backend generates a 32-byte cryptographic token (`secrets.token_urlsafe(32)`), stores `session:<token> -> user_id` in Redis with a 7-day TTL, and issues an `httpOnly`, `SameSite=Lax` cookie named `session`.
   - The token is never exposed to JavaScript; the response body only returns `{ "username": user["username"] }`.

3. **Profile Access & Update (`GET /api/profile` & `PUT /api/profile`)**
   - When the frontend calls `/api/profile`, the browser attaches the `session` cookie automatically (`credentials: "include"`).
   - Backend dependency `get_current_user` extracts the cookie, checks `session:<token>` in Redis, and refreshes the TTL (sliding expiration).
   - If the session is missing or expired, `401 Unauthorized` is returned and frontend redirects to `/login`.
   - `GET`: Combines `users` data (`username`, `email`) and `profiles` data (returns empty defaults if no profile exists yet).
   - `PUT`: Validates input, strips HTML and control characters, and performs an `upsert` in MongoDB `profiles` matching `user_id`.

4. **Logout (`POST /api/logout`)**
   - The backend reads the `session` cookie, deletes the key from Redis immediately, and clears the cookie from the browser (`Max-Age=0`).
   - Returns `204 No Content`. The frontend redirects the user to `/login`.

---

## 🚀 Running the App Locally

### 1. Prerequisites (Databases)

You need running instances of MongoDB (port 27017) and Redis (port 6379).

- **Option A: Local Installed Services**
  - If installed on Windows, ensure the MongoDB service and Memurai (Redis for Windows) or Redis service are started.
- **Option B: Using Docker**
  ```bash
  # Start MongoDB container
  docker run -d --name local-mongo -p 27017:27017 mongo:7

  # Start Redis container
  docker run -d --name local-redis -p 6379:6379 redis:7-alpine
  ```
- **Option C: Cloud Services**
  - Use MongoDB Atlas (`mongodb+srv://...`) and Upstash/Redis Cloud (`rediss://...`) by replacing the connection strings in `backend/.env`.

---

### 2. Environment Variables

#### Backend (`backend/.env`):
| Variable | Default Example | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URL |
| `MONGODB_DB` | `auth_app` | Database name |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `SESSION_TTL_SECONDS` | `604800` | Session lifetime (7 days in seconds) |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origin (no wildcards) |
| `COOKIE_SECURE` | `false` | `false` for localhost HTTP; `true` for HTTPS in production |

#### Frontend (`frontend/.env`):
| Variable | Default Example | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

### 3. Start the Backend

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python 3.12 virtual environment:
   ```bash
   # Windows
   py -3.12 -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be live at `http://localhost:8000`. You can test `http://localhost:8000/health`.

---

### 4. Start the Frontend

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to:
   ```
   http://localhost:5173
   ```

---

## 🛠️ How to Modify

### Where Validation Rules Live
All backend validation rules are defined in `backend/app/schemas.py`:
- **Username rules:** See `validate_username` validator (regex `^[a-zA-Z0-9_]{3,30}$`).
- **Password rules:** See `validate_password` validator (8–72 bytes, $\ge 1$ letter, $\ge 1$ digit).
- **Profile field limits:** In `ProfileUpdate` (`max_length`, `ge`/`le`, and `clean_text` sanitizers).
- **Client-side validation:** Mirror checks are located in `validateClientSide()` inside `frontend/src/pages/Register.jsx`.

### How to Add a New Profile Field (End-to-End)
Suppose you want to add a `location` field (string, max 50 characters):

1. **Backend Schema (`backend/app/schemas.py`):**
   ```python
   class ProfileUpdate(BaseModel):
       # ... other fields ...
       location: Optional[str] = Field(default="", max_length=50)

       @field_validator("location")
       @classmethod
       def clean_location(cls, v: Optional[str]) -> str:
           return clean_text(v)

   class ProfileResponse(BaseModel):
       # ... other fields ...
       location: str = ""
   ```

2. **Backend Routes (`backend/app/profile_routes.py`):**
   - In `get_profile`:
     ```python
     location=profile.get("location", "")
     ```
   - In `update_profile`:
     ```python
     update_fields["location"] = req.location
     ```

3. **Frontend Page (`frontend/src/pages/Profile.jsx`):**
   - Add `location` to initial state:
     ```javascript
     const [profile, setProfile] = useState({ full_name: '', age: '', bio: '', interests: '', location: '' });
     ```
   - In `useEffect`:
     ```javascript
     location: data.location || ''
     ```
   - In `handleSave`:
     ```javascript
     const payload = { ... profile.location ... };
     ```
   - Add the input element to the form:
     ```jsx
     <div className="mb-3">
       <label className="form-label" htmlFor="location">Location</label>
       <input
         id="location"
         name="location"
         type="text"
         maxLength={50}
         className="form-control"
         value={profile.location}
         onChange={handleChange}
         placeholder="e.g. San Francisco, CA"
       />
     </div>
     ```

---

## 🔒 Security Checklist Verification

| Requirement | Implementation | Status |
|---|---|:---:|
| Direct bcrypt hashing | Uses `bcrypt.hashpw` & `bcrypt.checkpw` directly with unique per-password salts | ✅ |
| No NoSQL Injection | Strict Pydantic types (`str`) enforce primitives; raw dicts like `{"$ne": ""}` are rejected with 422 | ✅ |
| No SQL Injection | Strict MongoDB queries with sanitized parameters; input like `' OR 1=1 --` fails authentication safely | ✅ |
| Secret Management | All credentials loaded via `.env`; `.env` is git-ignored while `.env.example` is committed | ✅ |
| Strict CORS Policy | Whitelists only `http://localhost:5173`, with `allow_credentials=True`, no wildcards | ✅ |
| httpOnly Session Cookies | 32-byte cryptographic random token in Redis with sliding TTL; cookie is `httpOnly`, `SameSite=Lax` | ✅ |
| Generic Auth Errors | Both wrong passwords and missing accounts return `401 "Invalid credentials"` | ✅ |
| XSS & Input Sanitization | Whitespace, control characters, and HTML tags stripped before saving; no `dangerouslySetInnerHTML` | ✅ |
| Brute-Force Rate Limiting | 5 failed logins within 15 minutes triggers `429 Too Many Requests` via Redis `INCR` + `EXPIRE` | ✅ |

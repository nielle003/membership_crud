# 👥 Membership Registration CRUD App

A full-stack membership management system with **JWT authentication**, **admin panel**, and **rate limiting**.

---

## ✨ Features

### 🔐 Authentication
- User registration with email/password
- JWT-based login with 1-hour token expiry
- Rate limiting (5/hour register, 10/hour login)
- Password hashing with bcrypt

### 👤 User Profile
- Personal dashboard with profile info
- Edit name, phone, and password
- Delete account with confirmation

### 👑 Admin Panel
- View all registered members (paginated)
- Add, edit, and delete any member
- Admin-only endpoints with access control

### 🛡️ Security
- JWT tokens in sessionStorage (cleared on browser close)
- Owner-only profile modifications
- SQL injection prevention via SQLAlchemy ORM
- Rate limiting on auth endpoints
- CORS protection

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router, CSS3 |
| **Backend** | FastAPI, SQLAlchemy 2.0 |
| **Database** | PostgreSQL |
| **Auth** | JWT (python-jose), bcrypt |
| **Rate Limiting** | SlowAPI |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL running locally

### 1. Database Setup

```bash
psql -U postgres
```

```sql
CREATE USER member_user WITH PASSWORD 'secure_pass_123';
CREATE DATABASE membership_crud OWNER member_user;
\c membership_crud

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON members(email);
\q
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/Mac
.\venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://member_user:secure_pass_123@localhost:5432/membership_crud
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
DEBUG=true
```

```bash
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Create `frontend/.env.local`:
```
REACT_APP_API_URL=http://localhost:8000
```

### 4. Promote Admin

```bash
psql -U postgres -d membership_crud
UPDATE members SET is_admin = true WHERE email = 'your-email@example.com';
\q
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account (5/hour) |
| POST | `/api/auth/login` | ❌ | Get JWT token (10/hour) |
| GET | `/api/members/me` | ✅ | Get own profile |
| PUT | `/api/members/{id}` | ✅ | Update own profile |
| DELETE | `/api/members/{id}` | ✅ | Delete own account |
| GET | `/api/admin/members` | Admin | List all members (paginated) |
| POST | `/api/admin/members` | Admin | Add a member |
| PUT | `/api/admin/members/{id}` | Admin | Edit any member |
| DELETE | `/api/admin/members/{id}` | Admin | Delete any member |
| GET | `/health` | ❌ | Health check |

---

## 📁 Project Structure

```
membership-registration/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, rate limiter
│   │   ├── routers/        # Auth, members, admin endpoints
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic validation
│   │   └── main.py         # FastAPI entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Register, Dashboard, Edit, Admin
│   │   ├── styles/         # CSS stylesheets
│   │   ├── AuthContext.jsx # Auth state management
│   │   ├── useAuth.jsx     # Auth hook
│   │   └── App.jsx         # Router setup
│   ├── package.json
│   └── .env.local
├── DEPLOY.md               # Free deployment guide (Render + Vercel)
└── README.md
```

---

## 🧪 Testing

Open `http://localhost:8000/docs` for the Swagger UI.

**Full user flow:**
1. Register → Login → View Dashboard → Edit Profile → Delete Account

**Admin flow:**
1. Login as admin → Click "Manage Members" → View/Add/Edit/Delete members

---

## 🚀 Deployment

See **[DEPLOY.md](DEPLOY.md)** for a free deployment guide using Render (PostgreSQL + Backend) and Vercel (Frontend).

---

## 📄 License

MIT
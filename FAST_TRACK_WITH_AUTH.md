# 🔐 FAST-TRACK WITH AUTH (Registration + Login + CRUD)

**PRIORITY:** Auth + CRUD in 1-2 days. This is interview-level.

---

## ⏱️ Realistic Timeline (With Authentication)

```
DAY 1:
  Hour 1-2: Database setup + Backend structure
  Hour 2-3: User model + Registration/Login endpoints
  Hour 3-4: JWT auth + Protected routes
  Hour 4-5: React setup + Login/Register pages
  Hour 5-6: Auth context + Protected routes
  Hour 6-7: Dashboard + Profile CRUD
  Hour 7-8: Bug fixes + Integration

DAY 2 (if needed):
  Remaining bugs
  Token refresh
  Better error messages
  UI polish
  Deployment
```

**Total: 8-9 hours of focused work = Full auth + CRUD app**

---

## 🎯 What You're Building

**User Flow:**
1. Visitor lands → sees Login page
2. No account? → Register (create account)
3. Account created → Auto-redirect to Login
4. Login with email/password → Get JWT token
5. Logged in → Dashboard shows their profile
6. Can Edit or Delete their profile
7. Logout → Back to Login

**API Endpoints:**
```
POST   /api/auth/register        - Create account
POST   /api/auth/login           - Get JWT token
GET    /api/members/me           - Get logged-in user's profile (protected)
PUT    /api/members/{id}         - Update profile (protected)
DELETE /api/members/{id}         - Delete account (protected)
```

---

## 📋 Database Setup (Same as before)

```sql
-- Connect as postgres
psql -U postgres

-- Paste this:
CREATE USER member_user WITH PASSWORD 'secure_pass_123';
CREATE DATABASE membership_crud OWNER member_user;
\c membership_crud

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON members(email);

\q
```

---

## ⚡ Backend Setup (Updated for Auth)

### Step 1-3: Same as FAST_TRACK
- Create venv
- Install requirements (add `PyJWT`)
- Create .env file

### Step 4: requirements.txt (UPDATED)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
bcrypt==4.1.1
python-dotenv==1.0.0
pydantic[email]==2.5.0
PyJWT==2.8.1
slowapi==0.1.9
```

### Step 5: Folder Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── members.py
├── requirements.txt
├── .env
└── .gitignore
```

---

## 🔑 Backend Code (With Auth)

### backend/app/core/config.py
```python
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()
```

### backend/app/models.py
```python
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Member(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
```

### backend/app/schemas.py
```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Registration
class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str

# Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Token response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    member_id: int

# Member response (no password!)
class MemberResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Update profile
class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # Optional password change
```

### backend/app/core/security.py
```python
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

### backend/app/routers/auth.py
```python
from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.models import Member
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, MemberResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

@limiter.limit("5/hour")
@router.post("/register", response_model=MemberResponse, status_code=201)
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user (limited to 5 per hour per IP)"""
    # Check email exists
    existing = db.query(Member).filter(Member.email == req.email).first()
    if existing:
        raise HTTPException(409, "Email already registered")
    
    # Create member
    hashed_pw = hash_password(req.password)
    member = Member(
        email=req.email,
        full_name=req.full_name,
        phone=req.phone,
        password_hash=hashed_pw
    )
    
    try:
        db.add(member)
        db.commit()
        db.refresh(member)
        return member
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already exists")

@limiter.limit("10/hour")
@router.post("/login", response_model=TokenResponse)
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """Login user - returns JWT token (limited to 10 per hour per IP to prevent brute force)"""
    # Find member
    member = db.query(Member).filter(Member.email == req.email).first()
    if not member:
        raise HTTPException(401, "Invalid email or password")
    
    # Verify password
    if not verify_password(req.password, member.password_hash):
        raise HTTPException(401, "Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": str(member.id), "email": member.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "member_id": member.id
    }
```

### backend/app/routers/members.py
```python
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Member
from app.schemas import MemberResponse, MemberUpdate
from app.core.security import decode_access_token, hash_password

router = APIRouter(prefix="/api/members", tags=["members"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthCredentials = Depends(security), db: Session = Depends(get_db)):
    """Extract user from JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(401, "Invalid token")
    
    member_id = int(payload.get("sub"))
    member = db.query(Member).filter(Member.id == member_id).first()
    
    if not member:
        raise HTTPException(401, "User not found")
    
    return member

@router.get("/me", response_model=MemberResponse)
def get_current_profile(current_user: Member = Depends(get_current_user)):
    """Get logged-in user's profile"""
    return current_user

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    req: MemberUpdate,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update member profile (only own profile)"""
    # Verify ownership
    if current_user.id != member_id:
        raise HTTPException(403, "Cannot modify other users")
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")
    
    # Update fields
    if req.full_name:
        member.full_name = req.full_name
    if req.phone:
        member.phone = req.phone
    if req.password:
        member.password_hash = hash_password(req.password)
    
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete member account (only own account)"""
    # Verify ownership
    if current_user.id != member_id:
        raise HTTPException(403, "Cannot delete other users")
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")
    
    db.delete(member)
    db.commit()
    return None
```

### backend/app/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.routers import auth, members

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Members API with Auth")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth.router)
app.include_router(members.router)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## 🎨 Frontend (React with Auth)

### Step 1: Create React App
```bash
cd ../frontend
npx create-react-app .
npm install axios
```

### Step 2: .env.local
```
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: src/AuthContext.js (Token storage + auth logic)
```javascript
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on load
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setMemberId(sessionStorage.getItem('memberId'));
    }
    setLoading(false);
  }, []);

  const login = (token, memberId) => {
    setToken(token);
    setMemberId(memberId);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('memberId', memberId);
  };

  const logout = () => {
    setToken(null);
    setMemberId(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('memberId');
  };

  return (
    <AuthContext.Provider value={{ token, memberId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Step 4: src/useAuth.js (Custom hook)
```javascript
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Step 5: src/ProtectedRoute.js (Redirect if not logged in)
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### Step 6: Install React Router
```bash
npm install react-router-dom
```

### Step 7: src/App.js (Main with routing)
```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditProfilePage from './pages/EditProfilePage';
import { ProtectedRoute } from './ProtectedRoute';
import './App.css';

function AppRoutes() {
  const { token, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {!token ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Step 8: src/pages/LoginPage.js
```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../useAuth';
import '../styles/Auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await res.json();
      login(data.access_token, data.member_id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Login</h1>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 9: src/pages/RegisterPage.js
```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          password: formData.password
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Register</h1>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 chars)"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 10: src/pages/DashboardPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function DashboardPage() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/members/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to load profile');

      const data = await res.json();
      setMember(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_URL}/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete account');

      logout();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!member) return <div className="container">No profile found</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout">
          Logout
        </button>
      </header>

      <div className="profile-card">
        <h2>Your Profile</h2>
        <div className="profile-info">
          <p><strong>Name:</strong> {member.full_name}</p>
          <p><strong>Email:</strong> {member.email}</p>
          <p><strong>Phone:</strong> {member.phone || 'Not set'}</p>
          <p><strong>Member Since:</strong> {new Date(member.created_at).toLocaleDateString()}</p>
        </div>

        <div className="profile-actions">
          <button 
            onClick={() => navigate(`/edit-profile`)}
            className="btn-edit"
          >
            Edit Profile
          </button>
          <button 
            onClick={handleDelete}
            className="btn-delete"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 11: src/pages/EditProfilePage.js
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import '../styles/EditProfile.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, memberId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/members/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to load profile');

      const data = await res.json();
      setFormData({
        full_name: data.full_name,
        phone: data.phone || '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`${API_URL}/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile</h1>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>

        <hr />
        <h3>Change Password (optional)</h3>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="password"
            placeholder="Leave blank to keep current password"
            value={formData.password}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn-save">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            disabled={submitting}
            className="btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 12: src/styles/Auth.css
```css
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.auth-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.auth-box form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-box input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.auth-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.auth-box button {
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

.auth-box button:hover:not(:disabled) {
  background: #764ba2;
}

.auth-box button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-box p {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.auth-box a {
  color: #667eea;
  text-decoration: none;
  font-weight: bold;
}

.auth-box a:hover {
  text-decoration: underline;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

@media (max-width: 480px) {
  .auth-box {
    padding: 20px;
  }
}
```

### Step 13: src/styles/Dashboard.css
```css
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
}

.btn-logout {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-logout:hover {
  background: #c82333;
}

.profile-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-card h2 {
  margin-top: 0;
  color: #333;
}

.profile-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
  margin: 20px 0;
}

.profile-info p {
  margin: 10px 0;
  color: #555;
}

.profile-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-edit,
.btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn-edit {
  background: #28a745;
  color: white;
}

.btn-edit:hover {
  background: #218838;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid #f5c6cb;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}
```

### Step 14: src/styles/EditProfile.css
```css
.edit-profile-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.edit-profile-container h1 {
  color: #333;
  margin-bottom: 30px;
}

.edit-profile-container h3 {
  color: #555;
  margin-top: 30px;
  margin-bottom: 15px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

.btn-save {
  background: #667eea;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #764ba2;
}

.btn-cancel {
  background: #ddd;
  color: #333;
}

.btn-cancel:hover:not(:disabled) {
  background: #ccc;
}

hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
}
```

### Step 15: src/index.js (Add styling)
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 16: src/index.css (Global styles)
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
  color: #333;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
```

---

## ✅ Testing Checklist

### Backend (30 min)
- [ ] Start backend: `uvicorn app.main:app --reload`
- [ ] Visit http://localhost:8000/docs
- [ ] Test POST /api/auth/register
- [ ] Test POST /api/auth/login (should return JWT token)
- [ ] Test GET /api/members/me (with token)
- [ ] Test PUT /api/members/{id} (with token)
- [ ] Test DELETE /api/members/{id} (with token)
- [ ] Verify passwords are hashed

### Frontend (30 min)
- [ ] Start frontend: `npm start`
- [ ] Register new account
- [ ] Should redirect to login
- [ ] Login with credentials
- [ ] Should show dashboard with profile
- [ ] Edit profile and save
- [ ] Delete account (should logout)

### Full Flow (15 min)
- [ ] Register → Login → Dashboard → Edit → Delete
- [ ] All redirects work correctly
- [ ] Token persists on refresh
- [ ] No console errors

---

## 💡 Key Points

1. **JWT tokens stored in sessionStorage** (cleared on browser close, safer than localStorage)
2. **Owner verification** - Users can only edit/delete their own profile
3. **Password hashing** - Never stored plaintext
4. **Protected routes** - Redirects to login if no token
5. **Error handling** - Meaningful error messages (but not too revealing)
6. **CORS** - Frontend and backend communicate securely

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Invalid token" error | Token expired (1 hour), need to login again |
| "Cannot modify other users" | Trying to edit someone else's profile |
| CORS error | Check ALLOWED_ORIGINS in .env |
| 409 Conflict on register | Email already exists |
| Blank dashboard after login | Token not being sent in header |

---

## 🎉 You've Got This!

**8-9 hours = Full auth + CRUD app**

This is a real, production-adjacent application. The interviewer will be impressed!

Let's go! 🚀

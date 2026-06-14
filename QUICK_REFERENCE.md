# 🚀 Quick Reference Card

Keep this open while coding. **Copy/paste from FAST_TRACK.md for actual code.**

---

## Backend Endpoints

```
POST   /api/members           Create new member
GET    /api/members           List all members
GET    /api/members/{id}      Get specific member
PUT    /api/members/{id}      Update member
DELETE /api/members/{id}      Delete member
```

**Test at:** `http://localhost:8000/docs`

---

## Frontend Flow

```
1. User fills form
2. Click "Add" button
3. POST to /api/members
4. Reload member list with GET /api/members
5. Show in table

Edit flow:
1. Click "Edit" button on member row
2. Populate form with member data
3. Click "Update"
4. PUT to /api/members/{id}
5. Reload list
6. Clear form and cancel edit mode

Delete flow:
1. Click "Delete" button
2. Confirm popup
3. DELETE /api/members/{id}
4. Reload list
```

---

## Essential Files

| File | Purpose |
|------|---------|
| `backend/.env` | Database URL & config |
| `backend/app/main.py` | FastAPI app & routes |
| `backend/app/models.py` | Database schema |
| `backend/app/routers/members.py` | CRUD endpoints |
| `frontend/.env.local` | API URL |
| `frontend/src/App.js` | React component |

---

## Database Table Structure

```sql
members
├── id (SERIAL PRIMARY KEY)
├── email (VARCHAR, UNIQUE)
├── full_name (VARCHAR)
├── phone (VARCHAR)
├── password_hash (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## API Request/Response Examples

### Create Member
```json
POST /api/members
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1-555-0123",
  "password": "SecurePass123"
}

Response 201:
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1-555-0123",
  "created_at": "2024-01-15T10:30:00"
}
```

### List Members
```
GET /api/members

Response 200:
[
  {
    "id": 1,
    "email": "user1@example.com",
    ...
  },
  {
    "id": 2,
    "email": "user2@example.com",
    ...
  }
]
```

### Update Member
```json
PUT /api/members/1
{
  "email": "newemail@example.com",
  "full_name": "Jane Doe",
  "phone": "+1-555-9999"
}

Response 200:
{
  "id": 1,
  "email": "newemail@example.com",
  "full_name": "Jane Doe",
  ...
}
```

### Delete Member
```
DELETE /api/members/1

Response 204: (no content)
```

---

## Commands to Run

```bash
# Backend
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm start
# Visit http://localhost:3000
```

---

## File Locations

```
membership-registration/
├── backend/
│   ├── app/
│   │   ├── main.py ← FastAPI setup
│   │   ├── database.py ← DB connection
│   │   ├── models.py ← Table schema
│   │   ├── schemas.py ← API validation
│   │   ├── core/
│   │   │   ├── config.py ← Load .env
│   │   │   └── security.py ← Password hashing
│   │   └── routers/
│   │       └── members.py ← CRUD endpoints
│   ├── .env ← Database credentials
│   └── requirements.txt ← Packages
│
├── frontend/
│   ├── src/
│   │   ├── App.js ← Main component
│   │   └── App.css ← Styling
│   └── .env.local ← API URL
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 201 | Created ✅ | Member added |
| 200 | OK ✅ | Member retrieved |
| 204 | No Content ✅ | Member deleted |
| 400 | Bad Request ❌ | Email already exists |
| 404 | Not Found ❌ | Member doesn't exist |
| 500 | Server Error ❌ | Database error |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "connection refused" | DB not running | Start PostgreSQL |
| "CORS error" | Backend CORS config | Check .env ALLOWED_ORIGINS |
| "404 Not Found" | Endpoint wrong | Check URL spelling |
| "422 Validation" | Bad input format | Check data types match schema |
| "Email already exists" | Duplicate email | Try different email |
| "Cannot GET /" | Frontend build failed | `npm start` to restart |

---

## Testing Checklist

**Quick test to verify everything works:**

```
1. POST /api/members with:
   - email: test1@example.com
   - full_name: Test User
   - phone: 1234567890
   - password: TestPass123

2. GET /api/members
   Should return array with 1 member

3. PUT /api/members/1 with:
   - email: test1@example.com (or new)
   - full_name: Updated Name

4. DELETE /api/members/1
   Should return 204

5. GET /api/members
   Should return empty array
```

---

## Passwords in Database

✅ **Good:** Hashed with bcrypt
```
password_hash = $2b$10$R9h/cIPz0gi.URNNGU3He.OPST9/PgBkqquzi.Ss7...
```

❌ **Bad:** Plaintext password
```
password = MyPassword123
```

**Always hash passwords before storing!**

---

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://member_user:password@localhost:5432/membership_crud
ALLOWED_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key
ENVIRONMENT=development
DEBUG=true
```

**Frontend (.env.local):**
```
REACT_APP_API_URL=http://localhost:8000
```

---

## Key Points to Remember

1. **Backend must run on port 8000**
2. **Frontend must run on port 3000**
3. **Passwords must be hashed**
4. **Database URL goes in .env (never commit!)**
5. **API URL goes in .env.local**
6. **Test endpoints in /docs first, then in UI**
7. **Check browser console for frontend errors**
8. **Check terminal for backend errors**
9. **Emails must be unique**
10. **Keep it simple - no fancy features**

---

## Files To Create (In Order)

```
backend/
├── requirements.txt ✏️
├── .env ✏️
├── .gitignore ✏️
└── app/
    ├── __init__.py ✏️
    ├── main.py ✏️
    ├── database.py ✏️
    ├── models.py ✏️
    ├── schemas.py ✏️
    ├── core/
    │   ├── __init__.py ✏️
    │   ├── config.py ✏️
    │   └── security.py ✏️
    └── routers/
        ├── __init__.py ✏️
        └── members.py ✏️

frontend/
├── .env.local ✏️
└── src/
    ├── App.js ✏️
    └── App.css ✏️
```

---

## Progress Checkpoints

✅ **When you should be here:**

- **1 hour:** Database created, packages installed, .env setup
- **2 hours:** Backend modules created, main.py done
- **3 hours:** All endpoints working in /docs
- **4 hours:** Frontend created, form appears
- **5 hours:** Can create/read/update/delete members
- **6 hours:** Full app tested, ready to ship

---

Keep this page open! You'll reference it constantly. 📌

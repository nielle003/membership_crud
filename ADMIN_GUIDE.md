# 👑 Admin Panel Guide (Add to FAST_TRACK_WITH_AUTH)

**Estimated Time:** 2-2.5 hours  
**Prerequisite:** Your auth + CRUD app is working (register, login, dashboard, edit, delete)

---

## 🧠 What We're Adding

- An **admin role** (`is_admin` column on members table)
- **Backend:** New endpoints for admin to list/edit/delete any member
- **Frontend:** Admin dashboard with member list, add/edit/delete from admin panel
- **Authorization:** Admin can access any profile; regular users can only access their own

---

## 📦 Step 1: Add `is_admin` to Database

### 1.1 Add column to models.py

Open `backend/app/models.py`. Add `is_admin` field to the `Member` class:

```python
# Add to imports:
from sqlalchemy import Boolean

# Inside Member class, add after `updated_at`:
is_admin = Column(Boolean, default=False)
```

**Why:** This is how we mark a user as admin. Default is `False` so new users are regular members.

### 1.2 Add column to the database table

Connect to PostgreSQL and run:

```sql
psql -U postgres
\c membership_crud
ALTER TABLE members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
\q
```

**Why:** The database table needs to match the updated model.

---

## 👑 Step 2: Manually Promote Yourself to Admin

After registering a user through the app, run:

```sql
psql -U postgres
\c membership_crud
UPDATE members SET is_admin = true WHERE email = 'your-email@example.com';
\q
```

**Why:** Users self-register as regular members. You manually promote them. Simple and secure.

---

## 🔧 Step 3: Update Backend Code

### 3.1 Update schemas.py — Add `is_admin` to response

In `MemberResponse`, add the `is_admin` field:

```python
class MemberResponse(BaseModel):
    # ...existing fields...
    is_admin: bool = False
    # ...existing code...
```

Also add a new schema for **creating a member** from the admin panel:

```python
# Add after MemberUpdate
class AdminMemberCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str
```

**Why:** The response needs to tell the frontend if the user is admin. The `AdminMemberCreate` is for the "Add Member" form in the admin panel.

### 3.2 Update the token to include `is_admin`

In `backend/app/routers/auth.py`, update the login response to include `is_admin` and add it to the JWT token payload.

**Explanation:** The frontend needs to know if the logged-in user is admin to show admin buttons. We put `is_admin` in both the JWT token and the login response.

### 3.3 Create `backend/app/routers/admin.py` — New admin endpoints

Create a new router file for admin-only endpoints:

- **GET /api/admin/members** — List all members (admin only)
- **POST /api/admin/members** — Create a new member (admin only)
- **PUT /api/admin/members/{member_id}** — Update any member (admin only)
- **DELETE /api/admin/members/{member_id}** — Delete any member (admin only)

Each endpoint must check `current_user.is_admin` is `True`. If not, return `403 Forbidden`.

**Why:** Separate router keeps concerns clean. Admin endpoints have their own prefix and don't interfere with user endpoints.

### 3.4 Register admin router in main.py

In `backend/app/main.py`, add:

```python
from app.routers import members, auth, admin
# ...existing code...
app.include_router(admin.router)
```

**Why:** FastAPI needs to know about the new router to serve its endpoints.

---

## 🎨 Step 4: Update Frontend

### 4.1 Update AuthContext.jsx — Store `is_admin` status

The `AuthContext` should track whether the user is admin:

- Add `isAdmin` state (default: false)
- Store/retrieve `is_admin` from sessionStorage
- Include `isAdmin` in context value

**In `login()` function**, accept a 3rd parameter `is_admin`:
```jsx
const login = (token, memberId, is_admin) => {
    // ... existing code ...
    setIsAdmin(is_admin);
    sessionStorage.setItem('is_admin', is_admin.toString());
};
```

**In `useEffect`** (loading from sessionStorage):
```jsx
setIsAdmin(sessionStorage.getItem('is_admin') === 'true');
```

**In `logout()`**: reset `isAdmin` to `false` + `removeItem('is_admin')`

**In the Provider value**: add `isAdmin` to the object

**Why:** Components need to know if the user is admin to conditionally show admin UI.

### 4.2 Update LoginPage.jsx — Pass `is_admin` to login

**In LoginPage.jsx**, after the login API call succeeds, pass `is_admin` from the response:

```jsx
const data = await res.json();
login(data.access_token, data.member_id, data.is_admin);  // 3rd arg!
navigate('/dashboard');
```

**Why:** The `login()` function in AuthContext now expects `is_admin` as the 3rd argument. Without it, `isAdmin` stays `false`.

### 4.3 Update DashboardPage.jsx — Show admin button

**Destructure `isAdmin`** from `useAuth()`:
```jsx
const { token, logout, isAdmin } = useAuth();
```

**Inside the dashboard-header**, add between the title and the logout button:
```jsx
<div className="dashboard-header">
    <h1>Dashboard</h1>
    <div className="header-actions">
        {isAdmin && (
            <button onClick={() => navigate('/admin/members')} className="btn-admin">
                Manage Members
            </button>
        )}
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout">
            Logout
        </button>
    </div>
</div>
```

Add this to `Dashboard.css`:
```css
.header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.btn-admin {
    padding: 8px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.btn-admin:hover {
    background: #764ba2;
}
```

**Why:** Regular users shouldn't see the admin button. `isAdmin` controls visibility.

### 4.4 Create AdminMembersPage.jsx — Member list

New page at `src/pages/AdminMembersPage.jsx`:

- Import `useState`, `useEffect`, `useNavigate`, `useAuth`
- On mount: `fetch('GET /api/admin/members')` with Bearer token
- Store result in `members` state array
- Render a table with columns: ID, Name, Email, Phone, Actions
- Actions column: Edit button → `navigate('/admin/members/${member.id}/edit')`, Delete button → `fetch('DELETE /api/admin/members/${member.id}')` then refresh list
- Header has "Add Member" button → `navigate('/admin/members/add')`
- Handle loading, error states

**Why:** This is the main admin interface — a table view of all members.

### 4.5 Create AdminEditMemberPage.jsx — Edit any member

New page at `src/pages/AdminEditMemberPage.jsx`:

- Import `useState`, `useEffect`, `useNavigate`, `useParams`, `useAuth`
- `useParams()` to get `{ id }` from the URL
- On mount: `fetch('GET /api/members/me')` with Bearer token (get member data)
- Wait — actually you'll need the admin's own ID or better: Just fetch the specific member. Since there's no `GET /api/admin/members/{id}`, use the full list and filter, or add that endpoint. **Simplest:** add a `GET /api/admin/members/{member_id}` endpoint in `admin.py`:
  ```python
  @router.get("/members/{member_id}", response_model=MemberResponse)
  def get_member(member_id: int, db: database, _: Annotated[Member, Depends(get_admin_user)]):
      member = db.query(Member).filter(Member.id == member_id).first()
      if not member:
          raise HTTPException(404, "User not found")
      return member
  ```
- Form: full_name (required), phone, password (optional)
- On submit: `fetch('PUT /api/admin/members/${id}', { body: JSON with name, phone, password })`
- Success → redirect to `/admin/members`

**Why:** Admin can edit any member's details from here.

### 4.6 Create AdminAddMemberPage.jsx — Add new member

New page at `src/pages/AdminAddMemberPage.jsx`:

- Form: full_name, email, phone, password, confirmPassword
- Client-side validation: password match, min 8 chars
- On submit: `fetch('POST /api/admin/members', { body: JSON with email, full_name, phone, password })`
- Success → redirect to `/admin/members`
- Handle 409 error (email already exists)

**Why:** Admin can create new members directly without going through the registration form.

### 4.7 Update App.jsx — Add admin routes

**Import** the new pages:
```jsx
import AdminMembersPage from './pages/AdminMembersPage';
import AdminAddMemberPage from './pages/AdminAddMemberPage';
import AdminEditMemberPage from './pages/AdminEditMemberPage';
```

Inside the authenticated routes block (the `{token ? (...)` section), add:
```jsx
<Route path="/admin/members" element={<AdminMembersPage />} />
<Route path="/admin/members/add" element={<AdminAddMemberPage />} />
<Route path="/admin/members/:id/edit" element={<AdminEditMemberPage />} />
```

**Keep the catch-all route `path="*"` at the end** so unknown paths still redirect to dashboard.

**Why:** New pages need routes so users can navigate to them.

### 4.8 Create AdminDashboard.css — Admin page styling

Create `src/styles/AdminDashboard.css` for the members table and admin-specific UI:

```css
.admin-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.admin-table th {
    background: #667eea;
    color: white;
    padding: 12px;
    text-align: left;
}

.admin-table td {
    padding: 12px;
    border-bottom: 1px solid #eee;
}

.admin-table tr:hover {
    background: #f5f5f5;
}

.btn-add {
    padding: 10px 20px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
}

.btn-add:hover {
    background: #218838;
}

.btn-small-edit {
    padding: 5px 10px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    margin-right: 5px;
}

.btn-small-delete {
    padding: 5px 10px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.btn-small-edit:hover { background: #764ba2; }
.btn-small-delete:hover { background: #c82333; }
```

---

## ✅ Testing Checklist

### Backend (20 min)
- [ ] Verify `is_admin` column exists: `\d members` in psql
- [ ] Promote yourself: `UPDATE members SET is_admin = true WHERE email = '...';`
- [ ] Login and check login response includes `is_admin`
- [ ] Test `GET /api/admin/members` with admin token → 200 with list
- [ ] Test `GET /api/admin/members` with regular token → 403
- [ ] Test `POST /api/admin/members` — creates user
- [ ] Test `PUT /api/admin/members/{id}` — updates any user
- [ ] Test `DELETE /api/admin/members/{id}` — deletes any user

### Frontend (20 min)
- [ ] Login as admin → "Manage Members" button visible
- [ ] Login as regular user → "Manage Members" NOT visible
- [ ] Click "Manage Members" → table of all members loads
- [ ] Click "Add Member" → form works, new member appears in list
- [ ] Click "Edit" on a member → edit form pre-filled, save works
- [ ] Click "Delete" → confirmation, member removed from list

---

## 💡 Architecture Notes

**Why separate `/api/admin/` endpoints instead of reusing user endpoints?**
- Cleaner authorization — no need for complex "if admin allow, else check owner" logic
- Easier to test and reason about
- Scales better if you add more admin features

**Why store `is_admin` in sessionStorage?**
- Consistent with token storage pattern
- Avoids an extra API call just to check admin status
- Cleared on browser close for security

**The ownership check in PUT/DELETE stays as-is.**
- Admin bypasses it via `/api/admin/` endpoints
- Regular users still protected by the existing check
- Both paths are secure

---

## ⚠️ Common Mistakes

| Problem | Solution |
|---------|----------|
| Admin sees 403 on admin endpoints | Check JWT payload includes `is_admin`, or the endpoint isn't reading it correctly |
| "Manage Members" button not showing | Check `AuthContext` is returning `isAdmin` correctly |
| Admin table shows empty even with members | Check `GET /api/admin/members` query — might be filtering wrong |
| "Add Member" form fails | Check `AdminMemberCreate` schema matches what you're sending |
| Newly added members not appearing | Check the endpoint returns the full member list, not just the created one |
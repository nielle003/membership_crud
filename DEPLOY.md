# 🚀 Deploy to Production (Free)

**Stack:** Render (PostgreSQL + Backend) + Vercel (Frontend)  
**Cost:** $0/month  
**Time:** ~1 hour

---

## 📦 Prerequisites

- [ ] GitHub account
- [ ] Your code pushed to a GitHub repository
- [ ] Render account (sign up at https://render.com — "Free" plan)
- [ ] Vercel account (sign up at https://vercel.com — "Hobby" plan)

---

## Step 1: Push to GitHub

```bash
cd "C:\Users\Nielle\Documents\Programming shit\Portfolio\membership-registration"

# Initialize git if not done
git init
git add .
git commit -m "Initial commit"

# Create a repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/membership-registration.git
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name:** `membership-db`
   - **Database:** `membership_crud`
   - **User:** `member_user`
   - **Region:** Choose one close to you (e.g., `Frankfurt`)
4. Click **Create Database**
5. Wait ~2 minutes for it to provision
6. Copy the **Internal Database URL** — it looks like:
   ```
   postgresql://member_user:xxxx@xxxx.render.com:5432/membership_crud
   ```
   Save this for later.

### Create the table

Once the database is ready, connect to it:

1. On your Render dashboard, click your new PostgreSQL database
2. Go to the **Shell** tab at the top
3. Paste and run:
```sql
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
```

---

## Step 3: Deploy Backend (FastAPI) on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Fill in:
   - **Name:** `membership-api`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Click **Advanced** → **Add Environment Variable**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the **Internal Database URL** from Step 2
   - **Key:** `SECRET_KEY`
   - **Value:** Generate one with this Python code:
     ```python
     import secrets; print(secrets.token_urlsafe(32))
     ```
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** (leave blank for now, we'll add the Vercel URL later)
   - **Key:** `ENVIRONMENT`
   - **Value:** `production`
   - **Key:** `DEBUG`
   - **Value:** `false`
6. Click **Create Web Service**
7. Wait ~5 minutes for build and deploy
8. Once deployed, copy your backend URL:
   ```
   https://membership-api.onrender.com
   ```

### Promote yourself to admin

1. Go to your Render PostgreSQL dashboard
2. Click **Shell** tab
3. Register a user through your app first (visit the `/docs` endpoint), then run:
```sql
UPDATE members SET is_admin = true WHERE email = 'your-email@example.com';
```

---

## Step 4: Deploy Frontend (React) on Vercel

### 4.1 Create `vercel.json`

Create this file in your project root (`membership-registration/vercel.json`):

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "framework": "create-react-app"
}
```

### 4.2 Push to GitHub

```bash
git add .
git commit -m "Add vercel.json for deployment"
git push
```

### 4.3 Deploy on Vercel

1. Go to https://vercel.com
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Fill in:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** Override to `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Click **Environment Variables**
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://membership-api.onrender.com` (your Render backend URL)
6. Click **Deploy**
7. Wait ~2 minutes
8. Copy your frontend URL:
   ```
   https://membership-registration.vercel.app
   ```

---

## Step 5: Update CORS

Go back to your Render backend dashboard → **Environment** → edit `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://membership-registration.vercel.app
```

Then click **Manual Deploy** → **Clear build cache & deploy** to restart the backend.

---

## ✅ Final Checklist

- [ ] Visit `https://membership-api.onrender.com/docs` — Swagger UI loads?
- [ ] Test `POST /api/auth/register` — creates user?
- [ ] Test `POST /api/auth/login` — returns token?
- [ ] Visit `https://membership-registration.vercel.app` — app loads?
- [ ] Register a user through the live app — works?
- [ ] Login through the live app — redirects to dashboard?
- [ ] Promote yourself to admin (psql shell on Render)
- [ ] See "Manage Members" button on admin dashboard
- [ ] Full CRUD works on live app?

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Backend deploy fails | Check the build logs. Ensure `requirements.txt` is in `backend/` folder. |
| "Internal Server Error" on API | Check Render logs. Usually a database connection issue — verify `DATABASE_URL`. |
| CORS error in browser | `ALLOWED_ORIGINS` must match your Vercel URL exactly (no trailing slash). |
| Blank frontend page | Check browser console. `REACT_APP_API_URL` might be wrong. |
| Rate limiting too strict | Login/Register fails after a few tries. Production IPs are shared, so consider increasing limits or disabling in production. |
| Backend sleeps after inactivity | Free Render web services spin down after 15 mins. First request takes ~30 seconds to wake up. |
| Database connection refused | Make sure you're using the **Internal** Database URL (not External) for the Render web service. |

---

## 🎉 Done!

Your app is live on the internet for free. Share the Vercel URL with your interviewer! 🚀
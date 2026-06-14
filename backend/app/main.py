from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from app.routers import members, auth, admin
from app.core.config import settings
from app.core.limiter import limiter

app = FastAPI(title="Members API with Auth")

#store the limiter in the app
app.state.limiter = limiter

#configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

#add all the routers from auth.py and members.py
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
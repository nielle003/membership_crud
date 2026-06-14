from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Member
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, MemberResponse
from app.core.security import verify_password, create_access_token, hash_password
from app.core.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])
database = Annotated[Session, Depends(get_db)]


@router.post("/register", response_model=MemberResponse, status_code=201)
@limiter.limit("5/hour")
def register(request: Request, req: RegisterRequest, db: database):
    #Register a user but only 5 per hour in the same IP address

    #first check if the email is already registered
    existing = db.query(Member).filter(Member.email == req.email).first()
    if existing:
        raise HTTPException(409, "Email already registered")
    
    #create the member
    hashed_password = hash_password(req.password)
    member = Member(
        email =req.email,
        full_name = req.full_name,
        phone =req.phone,
        password_hash = hashed_password
    )

    try:
        db.add(member)
        db.commit()
        db.refresh(member)
        return member
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    
@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/hour")
def login(request: Request, req: LoginRequest, db: database):
    #login user, but only 10 tries per hour in the same IP address
    
    #find member first by email
    member =db.query(Member).filter(Member.email == req.email).first()
    if not member:
        raise HTTPException(401, "Invalid email or password")
    
    #check password is correct
    if not verify_password(req.password, member.password_hash):
        raise HTTPException(401, "Invalid email or password")
    
    #then create access token
    access_token = create_access_token(data={"sub": str(member.id), "email": member.email, 'is_admin': bool(member.is_admin)})
    
    return{
        "access_token": access_token,
        "token_type": "bearer",
        "member_id": member.id,
        "is_admin": bool(member.is_admin)
    }
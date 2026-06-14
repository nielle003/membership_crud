from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Member
from app.schemas import RegisterRequest, MemberResponse, MemberUpdate, PaginatedMembers
from app.core.security import decode_access_token, hash_password
from app.core.limiter import limiter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/admin", tags=["admin"])
database = Annotated[Session, Depends(get_db)]
security = HTTPBearer()

cred = Annotated[HTTPAuthorizationCredentials, Depends(security)]

#helper function to verify admin user from JWT token
def get_admin_user(credentials: cred):
    #Extract user info from JWT token and verify admin privileges
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(401, "Invalid Token")
        
    admin = payload.get("is_admin")

    if not admin:
        raise HTTPException(403, "Admin privileges required")
    return True



@router.post("/members", response_model=MemberResponse, status_code=201)
@limiter.limit("5/hour")
def register(request: Request, req: RegisterRequest, db: database, admin_user: Annotated[Member, Depends(get_admin_user)]):
    #admin-only endpoint to register new members, but only 5 per hour in the same IP address

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
    

@router.get("/members", response_model=PaginatedMembers)
def get_all_users( db: database, admin_user: Annotated[Member, Depends(get_admin_user)], skip: int = 0, limit: int = 10):
    #admin-only endpoint to get all registered users

    total = db.query(Member).count() #get number of members in the database
    members = db.query(Member).offset(skip).limit(limit).all() #paginated
    return {"total": total, "skip": skip, "limit": limit, "members": members}


@router.put("/members/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    req: MemberUpdate,
    db: database,
    admin_user: Annotated[Member, Depends(get_admin_user)]
):
    #admin-only endpoint to update any member's profile

    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")
    
    #update the member fields if provided
    if req.full_name:
        member.full_name = req.full_name
    if req.phone:
        member.phone = req.phone
    if req.password:
        member.password_hash = hash_password(req.password)

    #then commit to the database
    db.commit()
    db.refresh(member)
    return member

@router.delete("/members/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    db: database,
    admin_user: Annotated[Member, Depends(get_admin_user)]
):
    #admin-only endpoint to delete a member

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")

    db.delete(member)
    db.commit()

@router.get("/members/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: database, _: Annotated[Member, Depends(get_admin_user)]):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")
    return member
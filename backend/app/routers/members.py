from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Member
from app.schemas import MemberResponse, MemberUpdate
from app.core.security import decode_access_token, hash_password
from typing import Annotated

router = APIRouter(prefix="/api/members", tags=["members"])
#expects JWT token in the Authorization header
security = HTTPBearer()
database = Annotated[Session, Depends(get_db)]

def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)], db: database):
    #Extract user info from JWT token
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(401, "Invalid Token")
        
    member_id = int(payload.get("sub"))
    member = db.query(Member).filter(Member.id == member_id).first()

    if not member: 
        raise HTTPException(404, "User not found")
    
    return member

user = Annotated[Member, Depends(get_current_user)]

@router.get("/me", response_model=MemberResponse)
def get_current_profile(current_user: user):
    #Get current user's profile
    return current_user

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    req: MemberUpdate,
    current_user: user,
    db: database
):
    #Update member profile, only if it's the same user
    #first verify the member_id matches the current user's id
    if current_user.id != member_id:
        raise HTTPException(403, "Not authorized to update this profile")
    
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

@router.delete("/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    current_user: user,
    db: database
):
    #Delete member profile, only if its the same user
    #first verify ownership
    if current_user.id != member_id:
        raise HTTPException(403, "Not authorized to delete this profile")
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "User not found")
    
    db.delete(member)
    db.commit()
    return None
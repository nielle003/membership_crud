from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


#Registration
class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str

#Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

#Token response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    member_id: int
    is_admin: bool

#Member response(no password!)
class MemberResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    created_at: datetime
    is_admin: bool = False
    
    class config:
        from_attribute = True

#update member information
class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

#create account using admin
class AdminMemberCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str

#pagination to not retieve all members at once
class PaginatedMembers(BaseModel):
    total: int
    skip: int
    limit: int
    members: list[MemberResponse]
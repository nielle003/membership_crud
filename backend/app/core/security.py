import bcrypt 
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    #hash password using bcrypt
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed:str) -> bool:
    #verify password against the hashed password
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data:dict) -> str:
    #create a JWT access token
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token:str) -> dict:
    #verify and decode JWT
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
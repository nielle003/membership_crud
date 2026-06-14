from sqlalchemy import Column, Integer, String, DateTime, func, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

#this whole code defines a standard for the required information to register a member.

class Member (Base):
    __tablename__ = 'members'

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
    is_admin = Column(Boolean, default=False)
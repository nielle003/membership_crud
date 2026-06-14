import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

#this configure the settings for the backend
class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")    #reads the url in the env file
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production") #gets the secret key from the env file, if not found uses a default value (not recommended for production)
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 #expires in after 1 hour
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") #gets the allowed origins from the env file, if not found uses a default value (not recommended for production)
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development") #gets the environment from the env file, if not found uses a default value (not recommended for production)
    DEBUG = os.getenv("DEBUG", "false").lower() == "true" #gets the debug mode from the env file, if not found uses a default value (not recommended for production)

settings = Settings()
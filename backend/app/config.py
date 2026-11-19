
import os
from datetime import timedelta

from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()


class Config:
    # Flask security
    SECRET_KEY = os.getenv("SECRET_KEY")

    # JWT authentication
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Groq AI configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

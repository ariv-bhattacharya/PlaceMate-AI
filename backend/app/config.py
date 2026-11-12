
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask security
    SECRET_KEY = os.getenv("SECRET_KEY")

    # JWT authentication
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # Keep access tokens valid for 8 hours during development.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

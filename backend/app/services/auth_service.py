
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.user import User


def register_user(name, email, password):
    name = name.strip()
    email = email.strip().lower()

    if not name or not email or not password:
        return {"error": "All fields are required."}, 400

    if len(password) < 8:
        return {"error": "Password must contain at least 8 characters."}, 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return {"error": "An account with this email already exists."}, 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role="student"
    )

    try:
        db.session.add(user)
        db.session.commit()

        return {
            "message": "Registration successful.",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }, 201

    except IntegrityError:
        db.session.rollback()
        return {"error": "An account with this email already exists."}, 409

    except Exception:
        db.session.rollback()
        raise


def login_user(email, password):
    email = email.strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return {"error": "Invalid email or password."}, 401

    if not user.is_active:
        return {"error": "This account has been deactivated."}, 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }, 200

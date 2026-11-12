
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from email_validator import validate_email, EmailNotValidError

from app.extensions import db
from app.models.user import User
from app.models.company import Company

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# --------------------------------------------------
# REGISTER
# POST /api/auth/register
# --------------------------------------------------

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Request body must be valid JSON."
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "student")

    # Validate input types before processing.
    if not all(isinstance(value, str) for value in [
        name, email, password, role
    ]):
        return jsonify({
            "message": "Name, email, password and role must be valid text."
        }), 400

    name = name.strip()
    email = email.strip().lower()
    password = password
    role = role.strip().lower()

    company_name = data.get("company_name", "")

    if not isinstance(company_name, str):
        return jsonify({
            "message": "Company name must be valid text."
        }), 400

    company_name = company_name.strip()

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email, and password are required."
        }), 400

    if len(name) > 120:
        return jsonify({
            "message": "Name must be 120 characters or fewer."
        }), 400

    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return jsonify({
            "message": "Please provide a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters."
        }), 400

    if len(password) > 128:
        return jsonify({
            "message": "Password must contain no more than 128 characters."
        }), 400

    # Public registration must not allow admin accounts.
    if role not in ["student", "recruiter"]:
        return jsonify({
            "message": "Role must be either student or recruiter."
        }), 400

    # Recruiter-specific validation.
    if role == "recruiter":
        if not company_name:
            return jsonify({
                "message": "Company name is required for recruiter registration."
            }), 400

        if len(company_name) > 150:
            return jsonify({
                "message": "Company name must be 150 characters or fewer."
            }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "An account with this email already exists."
        }), 409

    hashed_password = generate_password_hash(password)

    user = User(
        name=name,
        email=email,
        password_hash=hashed_password,
        role=role
    )

    try:
        # Create the user first so the database generates its ID.
        db.session.add(user)
        db.session.flush()

        company = None

        # Create and link a company only for recruiter accounts.
        if role == "recruiter":
            company = Company(
                recruiter_user_id=user.id,
                name=company_name
            )

            db.session.add(company)

        # Commit user and company together.
        db.session.commit()

        response_user = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }

        if company:
            response_user["company"] = {
                "id": company.id,
                "name": company.name
            }

        return jsonify({
            "message": "Registration successful.",
            "user": response_user
        }), 201

    except Exception as error:
        db.session.rollback()

        print("Registration error:", error)

        return jsonify({
            "message": "Registration failed. Please try again."
        }), 500


# --------------------------------------------------
# LOGIN
# POST /api/auth/login
# --------------------------------------------------

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Request body must be valid JSON."
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({
            "message": "Email and password are required."
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(
        user.password_hash, password
    ):
        return jsonify({
            "message": "Invalid email or password."
        }), 401

    if not user.is_active:
        return jsonify({
            "message": "Your account has been deactivated."
        }), 403

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful.",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# --------------------------------------------------
# GET CURRENT USER
# GET /api/auth/me
# Requires JWT token
# --------------------------------------------------

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid user identity."
        }), 401

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    if not user.is_active:
        return jsonify({
            "message": "Your account has been deactivated."
        }), 403

    response_user = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": (
            user.created_at.isoformat()
            if user.created_at else None
        )
    }

    if user.role == "recruiter":
        company = Company.query.filter_by(
            recruiter_user_id=user.id
        ).first()

        response_user["company"] = (
            {
                "id": company.id,
                "name": company.name
            }
            if company else None
        )

    return jsonify({
        "user": response_user
    }), 200


# --------------------------------------------------
# LOGOUT
# POST /api/auth/logout
# --------------------------------------------------

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT access tokens are stateless. A real server-side
    # logout requires a token blocklist or refresh-token strategy.
    return jsonify({
        "message": (
            "Logout successful. "
            "Remove the access token from the client."
        )
    }), 200

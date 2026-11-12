
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Student


student_bp = Blueprint(
    "students",
    __name__,
    url_prefix="/api/students"
)


def get_logged_in_student():
    """Get the student profile belonging to the logged-in user."""

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, (
            jsonify({
                "status": "error",
                "message": "Invalid user identity."
            }),
            401
        )

    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return None, (
            jsonify({
                "status": "error",
                "message": "User not found or inactive."
            }),
            401
        )

    if user.role != "student":
        return None, (
            jsonify({
                "status": "error",
                "message": "Only students can access this profile."
            }),
            403
        )

    student = Student.query.filter_by(user_id=user.id).first()

    return student, None


def serialize_student(student):
    """Convert student profile into JSON-friendly data."""

    return {
        "id": student.id,
        "user_id": student.user_id,
        "name": student.user.name,
        "email": student.user.email,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "graduation_year": student.graduation_year,
        "cgpa": student.cgpa,
        "tenth_percentage": student.tenth_percentage,
        "twelfth_percentage": student.twelfth_percentage,
        "phone": student.phone,
        "location": student.location,
        "skills": student.skills or [],
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url
    }


@student_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    """Get the logged-in student's profile."""

    student, error = get_logged_in_student()

    if error:
        return error

    if not student:
        return jsonify({
            "status": "error",
            "message": "Student profile not found."
        }), 404

    return jsonify({
        "status": "success",
        "profile": serialize_student(student)
    }), 200


@student_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_my_profile():
    """Create or update the logged-in student's profile."""

    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid user identity."
        }), 401

    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return jsonify({
            "status": "error",
            "message": "User not found or inactive."
        }), 401

    if user.role != "student":
        return jsonify({
            "status": "error",
            "message": "Only students can update this profile."
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Please provide valid JSON data."
        }), 400

    allowed_fields = {
        "roll_number",
        "branch",
        "graduation_year",
        "cgpa",
        "tenth_percentage",
        "twelfth_percentage",
        "phone",
        "location",
        "linkedin_url",
        "github_url",
        "portfolio_url"
    }

    unknown_fields = set(data.keys()) - allowed_fields

    if unknown_fields:
        return jsonify({
            "status": "error",
            "message": "Unsupported profile fields.",
            "fields": sorted(unknown_fields)
        }), 400

    if not data:
        return jsonify({
            "status": "error",
            "message": "No profile information provided."
        }), 400

    student = Student.query.filter_by(user_id=user.id).first()

    if not student:
        student = Student(user_id=user.id)
        db.session.add(student)

    # Validate and update text fields
    text_limits = {
        "roll_number": 30,
        "branch": 100,
        "phone": 20,
        "location": 120,
        "linkedin_url": 255,
        "github_url": 255,
        "portfolio_url": 255
    }

    for field, max_length in text_limits.items():
        if field in data:
            value = data[field]

            if value is not None and not isinstance(value, str):
                return jsonify({
                    "status": "error",
                    "message": f"{field} must be text."
                }), 400

            value = value.strip() if value else None

            if value and len(value) > max_length:
                return jsonify({
                    "status": "error",
                    "message": f"{field} exceeds {max_length} characters."
                }), 400

            setattr(student, field, value or None)

    # Check roll number uniqueness
    if student.roll_number:
        existing = Student.query.filter(
            Student.roll_number == student.roll_number,
            Student.user_id != user.id
        ).first()

        if existing:
            return jsonify({
                "status": "error",
                "message": "This roll number is already registered."
            }), 409

    # Validate numeric academic fields
    numeric_fields = {
        "cgpa": (0, 10),
        "tenth_percentage": (0, 100),
        "twelfth_percentage": (0, 100)
    }

    for field, (minimum, maximum) in numeric_fields.items():
        if field in data:
            value = data[field]

            if value is None:
                setattr(student, field, None)
                continue

            if isinstance(value, bool) or not isinstance(value, (int, float)):
                return jsonify({
                    "status": "error",
                    "message": f"{field} must be a number."
                }), 400

            if not minimum <= value <= maximum:
                return jsonify({
                    "status": "error",
                    "message": f"{field} must be between {minimum} and {maximum}."
                }), 400

            setattr(student, field, float(value))

    # Validate graduation year
    if "graduation_year" in data:
        year = data["graduation_year"]

        if year is None:
            student.graduation_year = None

        elif (
            isinstance(year, bool)
            or not isinstance(year, int)
            or not 2000 <= year <= 2100
        ):
            return jsonify({
                "status": "error",
                "message": "Please provide a valid graduation year."
            }), 400

        else:
            student.graduation_year = year

    try:
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Student profile updated successfully.",
            "profile": serialize_student(student)
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to update student profile."
        }), 500

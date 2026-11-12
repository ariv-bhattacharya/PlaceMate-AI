
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import User, Student
from app.ai.skill_gap_analyzer import (
    analyze_skill_gap,
    get_available_careers
)


analytics_bp = Blueprint(
    "analytics",
    __name__,
    url_prefix="/api/analytics"
)


def get_current_student():
    """Retrieve the logged-in student's profile."""

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, {
            "status": "error",
            "message": "Invalid user identity."
        }, 401

    user = db_user = User.query.get(user_id)

    if not db_user or not db_user.is_active:
        return None, {
            "status": "error",
            "message": "User not found or inactive."
        }, 401

    if user.role != "student":
        return None, {
            "status": "error",
            "message": "Only students can access career analytics."
        }, 403

    student = Student.query.filter_by(user_id=user.id).first()

    if not student:
        return None, {
            "status": "error",
            "message": "Student profile not found."
        }, 404

    return student, None, None


@analytics_bp.route("/careers", methods=["GET"])
@jwt_required()
def list_available_careers():
    """Get all career paths supported by the AI analyzer."""

    student, error, status_code = get_current_student()

    if error:
        return jsonify(error), status_code

    careers = get_available_careers()

    return jsonify({
        "status": "success",
        "count": len(careers),
        "careers": careers
    }), 200


@analytics_bp.route("/skill-gap", methods=["POST"])
@jwt_required()
def get_skill_gap():
    """
    Analyze the logged-in student's skills against
    a selected career path.
    """

    student, error, status_code = get_current_student()

    if error:
        return jsonify(error), status_code

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Please provide valid JSON data."
        }), 400

    career = data.get("career")

    if not isinstance(career, str) or not career.strip():
        return jsonify({
            "status": "error",
            "message": "Please provide a career name."
        }), 400

    # Use actual skills stored in the student's profile.
    student_skills = student.skills or []

    result = analyze_skill_gap(
        student_skills=student_skills,
        career=career.strip()
    )

    if not result.get("success"):
        return jsonify({
            "status": "error",
            **result
        }), 404

    return jsonify({
        "status": "success",
        "student_skill_count": len(student_skills),
        "analysis": result
    }), 200

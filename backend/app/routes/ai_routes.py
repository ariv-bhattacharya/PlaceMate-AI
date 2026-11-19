
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Student, Resume
from app.ai.career_mentor import generate_career_guidance


ai_bp = Blueprint(
    "ai",
    __name__,
    url_prefix="/api/ai"
)


@ai_bp.route("/career-mentor", methods=["POST"])
@jwt_required()
def career_mentor():
    """Generate personalized career guidance for the logged-in student."""

    # 1. Verify logged-in user
    try:
        user_id = int(get_jwt_identity())
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
            "message": "Only students can use the Career Mentor."
        }), 403

    # 2. Fetch student's profile
    student = Student.query.filter_by(user_id=user.id).first()

    if not student:
        return jsonify({
            "status": "error",
            "message": "Please complete your student profile first."
        }), 404

    # 3. Validate the question
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Please provide valid JSON data."
        }), 400

    question = data.get("question")

    if not isinstance(question, str) or not question.strip():
        return jsonify({
            "status": "error",
            "message": "Please enter a career-related question."
        }), 400

    question = question.strip()

    if len(question) > 1000:
        return jsonify({
            "status": "error",
            "message": "Question cannot exceed 1000 characters."
        }), 400

    # 4. Fetch the latest active resume, if available
    resume = Resume.query.filter_by(
        student_id=student.id,
        is_active=True
    ).order_by(
        Resume.uploaded_at.desc()
    ).first()

    # 5. Generate AI response using Groq
    try:
        answer = generate_career_guidance(
            student=student,
            question=question,
            resume=resume
        )

        return jsonify({
            "status": "success",
            "message": "Career guidance generated successfully.",
            "answer": answer
        }), 200

    except ValueError as error:
        current_app.logger.error(
            "Career Mentor configuration error: %s", error
        )

        return jsonify({
            "status": "error",
            "message": "AI Career Mentor is not configured correctly."
        }), 503

    except Exception:
        current_app.logger.exception(
            "Career Mentor request failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate career guidance right now. Please try again."
        }), 502

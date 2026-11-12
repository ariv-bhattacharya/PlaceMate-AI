
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.user import User
from app.models.student import Student
from app.models.resume import Resume
from app.services.resume_service import save_and_parse_resume


resume_bp = Blueprint(
    "resume",
    __name__,
    url_prefix="/api/resumes"
)


@resume_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    """Upload and parse a student's resume."""

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    if user.role != "student":
        return jsonify({
            "message": "Only students can upload resumes."
        }), 403

    if "resume" not in request.files:
        return jsonify({
            "message": "Please attach a resume using the 'resume' field."
        }), 400

    uploaded_file = request.files["resume"]

    try:
        result = save_and_parse_resume(
            uploaded_file=uploaded_file,
            user_id=user.id
        )

        return jsonify({
            "message": "Resume uploaded and parsed successfully.",
            "resume": result
        }), 201

    except ValueError as error:
        return jsonify({
            "message": str(error)
        }), 400

    except Exception as error:
        print("Resume upload error:", error)

        return jsonify({
            "message": "Resume upload failed. Please try again."
        }), 500


@resume_bp.route("/latest", methods=["GET"])
@jwt_required()
def get_latest_resume():
    """Retrieve the student's latest active resume analysis."""

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found."
        }), 404

    if user.role != "student":
        return jsonify({
            "message": "Only students can access resume details."
        }), 403

    student = Student.query.filter_by(
        user_id=user.id
    ).first()

    if not student:
        return jsonify({
            "message": "Student profile not found."
        }), 404

    resume = (
        Resume.query
        .filter_by(
            student_id=student.id,
            is_active=True
        )
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    if not resume:
        return jsonify({
            "message": "No active resume found."
        }), 404

    extracted_skills = resume.extracted_skills or []
    parsed_text = resume.parsed_text or ""

    return jsonify({
        "status": "success",
        "resume": {
            "resume_id": resume.id,
            "file_name": resume.file_name,
            "file_type": (
                resume.file_name.rsplit(".", 1)[-1].upper()
                if "." in resume.file_name else "UNKNOWN"
            ),
            "word_count": len(parsed_text.split()),
            "extracted_skills": extracted_skills,
            "total_skills": len(extracted_skills),
            "uploaded_at": (
                resume.uploaded_at.isoformat()
                if resume.uploaded_at else None
            ),
            "resume_score": resume.resume_score
        }
    }), 200


from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import Student
from app.services.job_service import (
    get_active_jobs,
    get_job_by_id,
    get_latest_active_resume,
    calculate_resume_match,
    serialize_job
)
from app.services.eligibility_service import check_job_eligibility


job_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


def get_current_student():
    """Get the student profile of the logged-in user."""

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

    return Student.query.filter_by(user_id=user_id).first()


@job_bp.route("/", methods=["GET"])
@jwt_required()
def list_jobs():
    """Get active jobs with eligibility and AI resume matching."""

    student = get_current_student()

    if not student:
        return jsonify({
            "status": "error",
            "message": "Student profile not found."
        }), 404

    # Fetch the student's latest active resume once
    resume = get_latest_active_resume(student.id)

    jobs = get_active_jobs()
    result = []

    for job in jobs:
        job_data = serialize_job(job)

        # Formal academic eligibility
        job_data["eligibility"] = check_job_eligibility(
            student, job
        )

        # AI resume-to-job matching
        job_data["resume_match"] = calculate_resume_match(
            resume, job
        )

        result.append(job_data)

    return jsonify({
        "status": "success",
        "count": len(result),
        "jobs": result
    }), 200


@job_bp.route("/<int:job_id>", methods=["GET"])
@jwt_required()
def get_job_details(job_id):
    """Get one job with eligibility and AI resume matching."""

    student = get_current_student()

    if not student:
        return jsonify({
            "status": "error",
            "message": "Student profile not found."
        }), 404

    job = get_job_by_id(job_id)

    if not job or not job.is_active:
        return jsonify({
            "status": "error",
            "message": "Job not found or is inactive."
        }), 404

    resume = get_latest_active_resume(student.id)

    job_data = serialize_job(job)

    job_data["eligibility"] = check_job_eligibility(
        student, job
    )

    job_data["resume_match"] = calculate_resume_match(
        resume, job
    )

    return jsonify({
        "status": "success",
        "job": job_data
    }), 200

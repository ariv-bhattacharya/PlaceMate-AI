
from datetime import datetime, timezone
import math

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.company import Company
from app.models.job import Job


recruiter_bp = Blueprint(
    "recruiter",
    __name__,
    url_prefix="/api/recruiter"
)


# ==================================================
# AUTHENTICATION AND COMPANY OWNERSHIP
# ==================================================

def get_current_recruiter_company():
    """Return the authenticated recruiter's linked company."""

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, (jsonify({
            "status": "error",
            "message": "Invalid user identity."
        }), 401)

    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return None, (jsonify({
            "status": "error",
            "message": "User not found or inactive."
        }), 401)

    if user.role != "recruiter":
        return None, (jsonify({
            "status": "error",
            "message": "Only recruiters can access this endpoint."
        }), 403)

    company = Company.query.filter_by(
        recruiter_user_id=user.id
    ).first()

    if not company:
        return None, (jsonify({
            "status": "error",
            "message": "No company is linked to your recruiter account."
        }), 404)

    return company, None


def get_company_job(company_id, job_id):
    """Find a job only if it belongs to the recruiter's company."""

    return Job.query.filter_by(
        id=job_id,
        company_id=company_id
    ).first()


# ==================================================
# JOB SERIALIZATION
# ==================================================

def serialize_recruiter_job(job):
    """Convert a job into JSON-friendly data."""

    return {
        "id": job.id,
        "company_id": job.company_id,
        "company_name": job.company.name if job.company else None,
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "location": job.location,
        "job_type": job.job_type,
        "salary": job.salary,
        "min_cgpa": job.min_cgpa,
        "eligible_branches": job.eligible_branches or [],
        "graduation_year": job.graduation_year,
        "application_deadline": (
            job.application_deadline.isoformat()
            if job.application_deadline else None
        ),
        "is_active": job.is_active,
        "created_at": (
            job.created_at.isoformat()
            if job.created_at else None
        ),
        "applicant_count": len(job.applications)
    }


# ==================================================
# JOB INPUT VALIDATION
# ==================================================

def validate_job_payload(data, partial=False):
    """
    Validate job fields for creation or editing.

    Returns:
        (cleaned_data, error_message)
    """

    if not isinstance(data, dict):
        return None, "Request body must contain valid JSON."

    allowed_fields = {
        "title",
        "description",
        "required_skills",
        "location",
        "job_type",
        "salary",
        "min_cgpa",
        "eligible_branches",
        "graduation_year",
        "application_deadline"
    }

    unknown_fields = set(data.keys()) - allowed_fields

    if unknown_fields:
        return None, (
            "Unsupported fields: " + ", ".join(sorted(unknown_fields))
        )

    # Required fields during creation.
    if not partial:
        for field in ("title", "description"):
            if field not in data:
                return None, (
                    f"{field.replace('_', ' ').title()} is required."
                )

    cleaned = {}

    # Required text fields.
    text_limits = {
        "title": 150,
        "description": None
    }

    for field, maximum in text_limits.items():
        if field not in data:
            continue

        value = data[field]

        if not isinstance(value, str):
            return None, (
                f"{field.replace('_', ' ').title()} must be text."
            )

        value = value.strip()

        if not value:
            return None, (
                f"{field.replace('_', ' ').title()} cannot be empty."
            )

        if maximum and len(value) > maximum:
            return None, (
                f"{field.replace('_', ' ').title()} "
                f"must be {maximum} characters or fewer."
            )

        cleaned[field] = value

    # Optional text fields.
    optional_text_limits = {
        "location": 150,
        "job_type": 50,
        "salary": 100
    }

    for field, maximum in optional_text_limits.items():
        if field not in data:
            continue

        value = data[field]

        if value is None or value == "":
            cleaned[field] = None
            continue

        if not isinstance(value, str):
            return None, (
                f"{field.replace('_', ' ').title()} must be text."
            )

        value = value.strip()

        if len(value) > maximum:
            return None, (
                f"{field.replace('_', ' ').title()} "
                f"must be {maximum} characters or fewer."
            )

        cleaned[field] = value or None

    # List fields.
    for field in ("required_skills", "eligible_branches"):
        if field not in data:
            continue

        value = data[field]

        if not isinstance(value, list):
            return None, (
                f"{field.replace('_', ' ').title()} must be a list."
            )

        if not all(isinstance(item, str) for item in value):
            return None, f"Every item in {field} must be text."

        cleaned[field] = [
            item.strip()
            for item in value
            if item.strip()
        ]

    # Minimum CGPA.
    if "min_cgpa" in data:
        value = data["min_cgpa"]

        if value is None or value == "":
            cleaned["min_cgpa"] = None
        else:
            if isinstance(value, bool):
                return None, (
                    "Minimum CGPA must be a number between 0 and 10."
                )

            try:
                cgpa = float(value)
            except (TypeError, ValueError):
                return None, "Minimum CGPA must be a valid number."

            if not math.isfinite(cgpa) or not 0 <= cgpa <= 10:
                return None, "Minimum CGPA must be between 0 and 10."

            cleaned["min_cgpa"] = cgpa

    # Graduation year.
    if "graduation_year" in data:
        value = data["graduation_year"]

        if value is None or value == "":
            cleaned["graduation_year"] = None
        else:
            if isinstance(value, bool):
                return None, "Graduation year must be a valid year."

            try:
                year = int(value)
            except (TypeError, ValueError):
                return None, "Graduation year must be a valid year."

            if year < 1900 or year > 2200:
                return None, "Please provide a valid graduation year."

            cleaned["graduation_year"] = year

    # Application deadline.
    if "application_deadline" in data:
        value = data["application_deadline"]

        if value is None or value == "":
            cleaned["application_deadline"] = None

        elif not isinstance(value, str):
            return None, (
                "Application deadline must be an ISO date string."
            )

        else:
            try:
                deadline = datetime.fromisoformat(
                    value.strip().replace("Z", "+00:00")
                )

                # Store timezone-aware timestamps as naive UTC,
                # consistent with the existing DateTime column.
                if deadline.tzinfo is not None:
                    deadline = deadline.astimezone(
                        timezone.utc
                    ).replace(tzinfo=None)

                cleaned["application_deadline"] = deadline

            except ValueError:
                return None, (
                    "Invalid application deadline. "
                    "Use ISO format, for example "
                    "2026-12-31T23:59:00."
                )

    return cleaned, None


# ==================================================
# CREATE JOB
# POST /api/recruiter/jobs
# ==================================================

@recruiter_bp.route("/jobs", methods=["POST"])
@jwt_required()
def create_recruiter_job():

    company, error = get_current_recruiter_company()

    if error:
        return error

    data = request.get_json(silent=True)

    cleaned, validation_error = validate_job_payload(data)

    if validation_error:
        return jsonify({
            "status": "error",
            "message": validation_error
        }), 400

    job = Job(
        company_id=company.id,
        title=cleaned["title"],
        description=cleaned["description"],
        required_skills=cleaned.get("required_skills", []),
        location=cleaned.get("location"),
        job_type=cleaned.get("job_type"),
        salary=cleaned.get("salary"),
        min_cgpa=cleaned.get("min_cgpa"),
        eligible_branches=cleaned.get("eligible_branches", []),
        graduation_year=cleaned.get("graduation_year"),
        application_deadline=cleaned.get("application_deadline"),
        is_active=True
    )

    try:
        db.session.add(job)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Job created successfully.",
            "job": serialize_recruiter_job(job)
        }), 201

    except Exception as error:
        db.session.rollback()
        print("Recruiter job creation error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to create the job."
        }), 500


# ==================================================
# GET RECRUITER'S JOBS
# GET /api/recruiter/jobs
# ==================================================

@recruiter_bp.route("/jobs", methods=["GET"])
@jwt_required()
def get_recruiter_jobs():

    company, error = get_current_recruiter_company()

    if error:
        return error

    jobs = (
        Job.query
        .filter_by(company_id=company.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "company": {
            "id": company.id,
            "name": company.name
        },
        "count": len(jobs),
        "jobs": [
            serialize_recruiter_job(job)
            for job in jobs
        ]
    }), 200


# ==================================================
# GET ONE RECRUITER JOB
# GET /api/recruiter/jobs/<job_id>
# ==================================================

@recruiter_bp.route("/jobs/<int:job_id>", methods=["GET"])
@jwt_required()
def get_recruiter_job_details(job_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    job = get_company_job(company.id, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found or access denied."
        }), 404

    return jsonify({
        "status": "success",
        "job": serialize_recruiter_job(job)
    }), 200


# ==================================================
# UPDATE RECRUITER JOB
# PATCH /api/recruiter/jobs/<job_id>
# ==================================================

@recruiter_bp.route("/jobs/<int:job_id>", methods=["PATCH"])
@jwt_required()
def update_recruiter_job(job_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    job = get_company_job(company.id, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found or access denied."
        }), 404

    data = request.get_json(silent=True)

    cleaned, validation_error = validate_job_payload(
        data,
        partial=True
    )

    if validation_error:
        return jsonify({
            "status": "error",
            "message": validation_error
        }), 400

    if not cleaned:
        return jsonify({
            "status": "error",
            "message": "Provide at least one field to update."
        }), 400

    try:
        for field, value in cleaned.items():
            setattr(job, field, value)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Job updated successfully.",
            "job": serialize_recruiter_job(job)
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Recruiter job update error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to update the job."
        }), 500


# ==================================================
# DEACTIVATE JOB
# PATCH /api/recruiter/jobs/<job_id>/deactivate
# ==================================================

@recruiter_bp.route(
    "/jobs/<int:job_id>/deactivate",
    methods=["PATCH"]
)
@jwt_required()
def deactivate_recruiter_job(job_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    job = get_company_job(company.id, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found or access denied."
        }), 404

    try:
        if not job.is_active:
            return jsonify({
                "status": "success",
                "message": "This job is already inactive.",
                "job": serialize_recruiter_job(job)
            }), 200

        job.is_active = False
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Job deactivated successfully.",
            "job": serialize_recruiter_job(job)
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Recruiter job deactivation error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to deactivate the job."
        }), 500


# ==================================================
# REACTIVATE JOB
# PATCH /api/recruiter/jobs/<job_id>/activate
# ==================================================

@recruiter_bp.route(
    "/jobs/<int:job_id>/activate",
    methods=["PATCH"]
)
@jwt_required()
def activate_recruiter_job(job_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    job = get_company_job(company.id, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found or access denied."
        }), 404

    try:
        if job.is_active:
            return jsonify({
                "status": "success",
                "message": "This job is already active.",
                "job": serialize_recruiter_job(job)
            }), 200

        job.is_active = True
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Job reactivated successfully.",
            "job": serialize_recruiter_job(job)
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Recruiter job reactivation error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to reactivate the job. Please try again."
        }), 500


from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.extensions import db

from app.models.user import User
from app.models.student import Student
from app.models.company import Company
from app.models.job import Job
from app.models.application import Application
from app.models.recruitment_round import RecruitmentRound

from app.services.eligibility_service import check_job_eligibility
from app.services.job_service import (
    get_latest_active_resume,
    calculate_resume_match
)


application_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/api/applications"
)


# ==================================================
# CONSTANTS
# ==================================================

RECRUITER_ALLOWED_STATUSES = {
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "selected",
    "rejected"
}

ROUND_ALLOWED_STATUSES = {
    "pending",
    "scheduled",
    "cleared",
    "rejected"
}


# ==================================================
# COMMON HELPERS
# ==================================================

def get_current_user():
    """Retrieve and validate the logged-in user."""

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

    return user, None


def get_current_student():
    """Retrieve the logged-in student's profile."""

    user, error = get_current_user()

    if error:
        return None, error

    if user.role != "student":
        return None, (jsonify({
            "status": "error",
            "message": "Only students can access this endpoint."
        }), 403)

    student = Student.query.filter_by(
        user_id=user.id
    ).first()

    if not student:
        return None, (jsonify({
            "status": "error",
            "message": "Student profile not found."
        }), 404)

    return student, None


def get_current_recruiter_company():
    """
    Retrieve the company linked to the logged-in recruiter.

    Recruiters can only manage applications belonging
    to their own company's jobs.
    """

    user, error = get_current_user()

    if error:
        return None, error

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
            "message": (
                "No company is linked to your recruiter account. "
                "Please contact the administrator."
            )
        }), 404)

    return company, None


def get_recruiter_owned_application(company_id, application_id):
    """Retrieve an application belonging to the recruiter's company."""

    return (
        Application.query
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.company_id == company_id
        )
        .first()
    )


def parse_datetime(value):
    """Parse an ISO datetime string into a naive UTC datetime."""

    if value is None or value == "":
        return None, None

    if not isinstance(value, str):
        return None, "Scheduled date must be a valid ISO datetime."

    try:
        parsed = datetime.fromisoformat(
            value.strip().replace("Z", "+00:00")
        )

        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(
                timezone.utc
            ).replace(tzinfo=None)

        return parsed, None

    except ValueError:
        return None, (
            "Invalid date and time. Use ISO format, "
            "for example 2026-12-15T10:30:00."
        )


def sync_application_status(application, round_status):
    """
    Synchronize the overall application status
    when an interview round outcome changes.
    """

    if round_status == "scheduled":
        if application.status not in ("selected", "rejected"):
            application.status = "interview_scheduled"

    elif round_status == "cleared":
        if application.status not in ("selected", "rejected"):
            application.status = "shortlisted"

    elif round_status == "rejected":
        application.status = "rejected"


# ==================================================
# SERIALIZATION
# ==================================================

def serialize_recruitment_round(round_item):
    """Convert a recruitment round into JSON."""

    return {
        "id": round_item.id,
        "application_id": round_item.application_id,
        "round_number": round_item.round_number,
        "round_name": round_item.round_name,
        "status": round_item.status,
        "scheduled_at": (
            round_item.scheduled_at.isoformat()
            if round_item.scheduled_at else None
        ),
        "feedback": round_item.feedback,
        "created_at": (
            round_item.created_at.isoformat()
            if round_item.created_at else None
        )
    }


def serialize_application(application):
    """Convert an application into JSON-friendly data."""

    job = application.job

    company_name = (
        job.company.name
        if job and job.company
        else "Unknown Company"
    )

    return {
        "id": application.id,
        "student_id": application.student_id,
        "job_id": application.job_id,
        "status": application.status,
        "match_score": application.match_score,

        "applied_at": (
            application.applied_at.isoformat()
            if application.applied_at else None
        ),

        "job": {
            "id": job.id,
            "title": job.title,
            "company_name": company_name,
            "location": job.location,
            "job_type": job.job_type,
            "salary": job.salary,
            "application_deadline": (
                job.application_deadline.isoformat()
                if job.application_deadline else None
            )
        },

        "recruitment_rounds": [
            serialize_recruitment_round(round_item)
            for round_item in application.recruitment_rounds
        ]
    }


def serialize_recruiter_application(application):
    """Include applicant information for authorized recruiters."""

    result = serialize_application(application)

    student = application.student
    student_user = student.user if student else None

    result["student"] = {
        "id": student.id if student else None,
        "name": (
            student_user.name
            if student_user else "Unknown Student"
        ),
        "email": student_user.email if student_user else None,
        "roll_number": student.roll_number if student else None,
        "branch": student.branch if student else None,
        "graduation_year": (
            student.graduation_year if student else None
        ),
        "cgpa": student.cgpa if student else None,
        "skills": (
            student.skills or [] if student else []
        )
    }

    return result


# ==================================================
# APPLY FOR A JOB
# POST /api/applications/
# STUDENT AUTHENTICATION REQUIRED
# ==================================================

@application_bp.route("/", methods=["POST"])
@jwt_required()
def apply_for_job():

    student, error = get_current_student()

    if error:
        return error

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    job_id = data.get("job_id")

    try:
        job_id = int(job_id)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "A valid job ID is required."
        }), 400

    if job_id <= 0:
        return jsonify({
            "status": "error",
            "message": "Job ID must be greater than zero."
        }), 400

    job = db.session.get(Job, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found."
        }), 404

    eligibility = check_job_eligibility(student, job)

    if not eligibility["is_eligible"]:
        return jsonify({
            "status": "error",
            "message": "You are not eligible for this job.",
            "eligibility": eligibility
        }), 403

    existing_application = Application.query.filter_by(
        student_id=student.id,
        job_id=job.id
    ).first()

    if existing_application:
        return jsonify({
            "status": "error",
            "message": "You have already applied for this job.",
            "application_id": existing_application.id
        }), 409

    resume = get_latest_active_resume(student.id)

    match_score = None

    if resume:
        match_result = calculate_resume_match(resume, job)

        if match_result.get("available"):
            match_score = match_result.get("match_score")

    application = Application(
        student_id=student.id,
        job_id=job.id,
        status="applied",
        match_score=match_score
    )

    try:
        db.session.add(application)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Job application submitted successfully.",
            "application": serialize_application(application)
        }), 201

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "You have already applied for this job."
        }), 409

    except Exception as error:
        db.session.rollback()
        print("Application submission error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to submit application. Please try again."
        }), 500


# ==================================================
# GET ALL STUDENT APPLICATIONS
# GET /api/applications/
# ==================================================

@application_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_applications():

    student, error = get_current_student()

    if error:
        return error

    applications = (
        Application.query
        .filter_by(student_id=student.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "count": len(applications),
        "applications": [
            serialize_application(application)
            for application in applications
        ]
    }), 200


# ==================================================
# GET APPLICATION DETAILS
# GET /api/applications/<application_id>
# ==================================================

@application_bp.route("/<int:application_id>", methods=["GET"])
@jwt_required()
def get_application_details(application_id):

    student, error = get_current_student()

    if error:
        return error

    application = Application.query.filter_by(
        id=application_id,
        student_id=student.id
    ).first()

    if not application:
        return jsonify({
            "status": "error",
            "message": "Application not found."
        }), 404

    return jsonify({
        "status": "success",
        "application": serialize_application(application)
    }), 200


# ==================================================
# GET RECRUITER APPLICATIONS
# GET /api/applications/recruiter
# ==================================================

@application_bp.route("/recruiter", methods=["GET"])
@jwt_required()
def get_recruiter_applications():

    company, error = get_current_recruiter_company()

    if error:
        return error

    applications = (
        Application.query
        .join(Job, Application.job_id == Job.id)
        .filter(Job.company_id == company.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "company": {
            "id": company.id,
            "name": company.name
        },
        "count": len(applications),
        "applications": [
            serialize_recruiter_application(application)
            for application in applications
        ]
    }), 200


# ==================================================
# UPDATE APPLICATION STATUS
# PATCH /api/applications/<application_id>/status
# ==================================================

@application_bp.route(
    "/<int:application_id>/status",
    methods=["PATCH"]
)
@jwt_required()
def update_application_status(application_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    new_status = data.get("status")

    if not isinstance(new_status, str):
        return jsonify({
            "status": "error",
            "message": "A valid application status is required."
        }), 400

    new_status = new_status.strip().lower()

    if new_status not in RECRUITER_ALLOWED_STATUSES:
        return jsonify({
            "status": "error",
            "message": "Invalid application status.",
            "allowed_statuses": sorted(
                RECRUITER_ALLOWED_STATUSES
            )
        }), 400

    application = get_recruiter_owned_application(
        company.id,
        application_id
    )

    if not application:
        return jsonify({
            "status": "error",
            "message": (
                "Application not found or you do not have "
                "permission to manage it."
            )
        }), 404

    try:
        application.status = new_status
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Application status updated successfully.",
            "application": serialize_recruiter_application(
                application
            )
        }), 200

    except Exception as error:
        db.session.rollback()
        print("Application status update error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to update application status."
        }), 500


# ==================================================
# GET RECRUITMENT ROUNDS
# GET /api/applications/<application_id>/rounds
# RECRUITER AUTHENTICATION REQUIRED
# ==================================================

@application_bp.route(
    "/<int:application_id>/rounds",
    methods=["GET"]
)
@jwt_required()
def get_recruitment_rounds(application_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    application = get_recruiter_owned_application(
        company.id,
        application_id
    )

    if not application:
        return jsonify({
            "status": "error",
            "message": "Application not found or access denied."
        }), 404

    rounds = (
        RecruitmentRound.query
        .filter_by(application_id=application.id)
        .order_by(RecruitmentRound.round_number.asc())
        .all()
    )

    return jsonify({
        "status": "success",
        "application_id": application.id,
        "count": len(rounds),
        "rounds": [
            serialize_recruitment_round(round_item)
            for round_item in rounds
        ]
    }), 200


# ==================================================
# CREATE RECRUITMENT ROUND
# POST /api/applications/<application_id>/rounds
#
# Example JSON:
# {
#   "round_name": "Technical Interview",
#   "status": "scheduled",
#   "scheduled_at": "2026-12-15T10:30:00",
#   "feedback": "Prepare for technical discussion."
# }
# ==================================================

@application_bp.route(
    "/<int:application_id>/rounds",
    methods=["POST"]
)
@jwt_required()
def create_recruitment_round(application_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    application = get_recruiter_owned_application(
        company.id,
        application_id
    )

    if not application:
        return jsonify({
            "status": "error",
            "message": "Application not found or access denied."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    round_name = data.get("round_name")

    if not isinstance(round_name, str) or not round_name.strip():
        return jsonify({
            "status": "error",
            "message": "Round name is required."
        }), 400

    round_name = round_name.strip()

    if len(round_name) > 100:
        return jsonify({
            "status": "error",
            "message": "Round name must be 100 characters or fewer."
        }), 400

    # Automatically assign the next round number if omitted.
    round_number = data.get("round_number")

    if round_number is None:
        highest_round = db.session.query(
            func.max(RecruitmentRound.round_number)
        ).filter_by(
            application_id=application.id
        ).scalar()

        round_number = (highest_round or 0) + 1

    else:
        if isinstance(round_number, bool):
            return jsonify({
                "status": "error",
                "message": "Round number must be a positive integer."
            }), 400

        try:
            round_number = int(round_number)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Round number must be a positive integer."
            }), 400

        if round_number <= 0:
            return jsonify({
                "status": "error",
                "message": "Round number must be greater than zero."
            }), 400

    status = data.get("status", "pending")

    if not isinstance(status, str):
        return jsonify({
            "status": "error",
            "message": "Invalid round status."
        }), 400

    status = status.strip().lower()

    if status not in ROUND_ALLOWED_STATUSES:
        return jsonify({
            "status": "error",
            "message": "Invalid round status.",
            "allowed_statuses": sorted(ROUND_ALLOWED_STATUSES)
        }), 400

    scheduled_at, date_error = parse_datetime(
        data.get("scheduled_at")
    )

    if date_error:
        return jsonify({
            "status": "error",
            "message": date_error
        }), 400

    feedback = data.get("feedback")

    if feedback is not None and not isinstance(feedback, str):
        return jsonify({
            "status": "error",
            "message": "Feedback must be text."
        }), 400

    if feedback and len(feedback) > 5000:
        return jsonify({
            "status": "error",
            "message": "Feedback cannot exceed 5000 characters."
        }), 400

    round_item = RecruitmentRound(
        application_id=application.id,
        round_number=round_number,
        round_name=round_name,
        status=status,
        scheduled_at=scheduled_at,
        feedback=feedback
    )

    try:
        db.session.add(round_item)

        sync_application_status(
            application,
            status
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Recruitment round created successfully.",
            "round": serialize_recruitment_round(round_item),
            "application_status": application.status
        }), 201

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": (
                "A round with this number already exists "
                "for this application."
            )
        }), 409

    except Exception as error:
        db.session.rollback()
        print("Recruitment round creation error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to create recruitment round."
        }), 500


# ==================================================
# UPDATE RECRUITMENT ROUND
# PATCH /api/applications/<application_id>/rounds/<round_id>
# ==================================================

@application_bp.route(
    "/<int:application_id>/rounds/<int:round_id>",
    methods=["PATCH"]
)
@jwt_required()
def update_recruitment_round(application_id, round_id):

    company, error = get_current_recruiter_company()

    if error:
        return error

    application = get_recruiter_owned_application(
        company.id,
        application_id
    )

    if not application:
        return jsonify({
            "status": "error",
            "message": "Application not found or access denied."
        }), 404

    round_item = RecruitmentRound.query.filter_by(
        id=round_id,
        application_id=application.id
    ).first()

    if not round_item:
        return jsonify({
            "status": "error",
            "message": "Recruitment round not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    allowed_fields = {
        "round_number",
        "round_name",
        "status",
        "scheduled_at",
        "feedback"
    }

    unknown_fields = set(data.keys()) - allowed_fields

    if unknown_fields:
        return jsonify({
            "status": "error",
            "message": "Unsupported fields: " + ", ".join(
                sorted(unknown_fields)
            )
        }), 400

    if not data:
        return jsonify({
            "status": "error",
            "message": "Provide at least one field to update."
        }), 400

    if "round_number" in data:
        value = data["round_number"]

        if isinstance(value, bool):
            return jsonify({
                "status": "error",
                "message": "Round number must be a positive integer."
            }), 400

        try:
            value = int(value)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Round number must be a positive integer."
            }), 400

        if value <= 0:
            return jsonify({
                "status": "error",
                "message": "Round number must be greater than zero."
            }), 400

        round_item.round_number = value

    if "round_name" in data:
        value = data["round_name"]

        if not isinstance(value, str) or not value.strip():
            return jsonify({
                "status": "error",
                "message": "Round name cannot be empty."
            }), 400

        value = value.strip()

        if len(value) > 100:
            return jsonify({
                "status": "error",
                "message": "Round name must be 100 characters or fewer."
            }), 400

        round_item.round_name = value

    if "status" in data:
        value = data["status"]

        if not isinstance(value, str):
            return jsonify({
                "status": "error",
                "message": "Invalid round status."
            }), 400

        value = value.strip().lower()

        if value not in ROUND_ALLOWED_STATUSES:
            return jsonify({
                "status": "error",
                "message": "Invalid round status.",
                "allowed_statuses": sorted(ROUND_ALLOWED_STATUSES)
            }), 400

        round_item.status = value

    if "scheduled_at" in data:
        scheduled_at, date_error = parse_datetime(
            data["scheduled_at"]
        )

        if date_error:
            return jsonify({
                "status": "error",
                "message": date_error
            }), 400

        round_item.scheduled_at = scheduled_at

    if "feedback" in data:
        value = data["feedback"]

        if value is not None and not isinstance(value, str):
            return jsonify({
                "status": "error",
                "message": "Feedback must be text."
            }), 400

        if value and len(value) > 5000:
            return jsonify({
                "status": "error",
                "message": "Feedback cannot exceed 5000 characters."
            }), 400

        round_item.feedback = value

    try:
        sync_application_status(
            application,
            round_item.status
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Recruitment round updated successfully.",
            "round": serialize_recruitment_round(round_item),
            "application_status": application.status
        }), 200

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": (
                "A round with this number already exists "
                "for this application."
            )
        }), 409

    except Exception as error:
        db.session.rollback()
        print("Recruitment round update error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to update recruitment round."
        }), 500

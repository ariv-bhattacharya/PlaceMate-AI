
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app.extensions import db

from app.models.user import User
from app.models.student import Student
from app.models.company import Company
from app.models.job import Job
from app.models.application import Application
from app.models.resume import Resume
from app.models.recruitment_round import RecruitmentRound


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ==================================================
# COMMON HELPERS
# ==================================================

def get_current_admin():
    """Validate that the current user is an active admin."""

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

    if user.role != "admin":
        return None, (jsonify({
            "status": "error",
            "message": "Admin access required."
        }), 403)

    return user, None


def get_pagination():
    """Read and validate pagination parameters."""

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except (TypeError, ValueError):
        return None, None

    if page < 1 or per_page < 1:
        return None, None

    return page, min(per_page, 100)


def serialize_datetime(value):
    """Convert a datetime into an ISO-formatted string."""

    return value.isoformat() if value else None


def invalid_pagination_response():
    return jsonify({
        "status": "error",
        "message": "Page and per_page must be positive integers."
    }), 400


# ==================================================
# ADMIN DASHBOARD STATISTICS
# GET /api/admin/dashboard
# ==================================================

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_admin_dashboard():

    admin, error = get_current_admin()

    if error:
        return error

    total_students = User.query.filter_by(
        role="student"
    ).count()

    total_recruiters = User.query.filter_by(
        role="recruiter"
    ).count()

    total_companies = Company.query.count()

    total_jobs = Job.query.count()

    active_jobs = Job.query.filter_by(
        is_active=True
    ).count()

    inactive_jobs = Job.query.filter_by(
        is_active=False
    ).count()

    total_applications = Application.query.count()

    total_resumes = Resume.query.count()

    application_statuses = db.session.query(
        Application.status,
        func.count(Application.id)
    ).group_by(
        Application.status
    ).all()

    recruitment_round_statuses = db.session.query(
        RecruitmentRound.status,
        func.count(RecruitmentRound.id)
    ).group_by(
        RecruitmentRound.status
    ).all()

    return jsonify({
        "status": "success",
        "message": "Admin dashboard statistics retrieved.",

        "admin": {
            "id": admin.id,
            "name": admin.name
        },

        "statistics": {
            "total_students": total_students,
            "total_recruiters": total_recruiters,
            "total_companies": total_companies,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "inactive_jobs": inactive_jobs,
            "total_applications": total_applications,
            "total_resumes": total_resumes
        },

        "application_statuses": {
            status: count
            for status, count in application_statuses
        },

        "recruitment_round_statuses": {
            status: count
            for status, count in recruitment_round_statuses
        }
    }), 200


# ==================================================
# ADMIN STUDENT DIRECTORY
# GET /api/admin/students
# ==================================================

@admin_bp.route("/students", methods=["GET"])
@jwt_required()
def get_all_students():

    admin, error = get_current_admin()

    if error:
        return error

    page, per_page = get_pagination()

    if page is None:
        return invalid_pagination_response()

    # LEFT OUTER JOIN ensures that student accounts
    # without completed Student profiles are included.

    query = (
        User.query
        .outerjoin(
            Student,
            Student.user_id == User.id
        )
        .filter(User.role == "student")
        .order_by(User.created_at.desc())
    )

    total = query.count()

    student_users = (
        query
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    results = []

    for user in student_users:

        student = user.student_profile

        results.append({
            "id": student.id if student else None,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,

            "roll_number": (
                student.roll_number if student else None
            ),

            "branch": (
                student.branch if student else None
            ),

            "graduation_year": (
                student.graduation_year if student else None
            ),

            "cgpa": (
                student.cgpa if student else None
            ),

            "tenth_percentage": (
                student.tenth_percentage if student else None
            ),

            "twelfth_percentage": (
                student.twelfth_percentage if student else None
            ),

            "skills_count": (
                len(student.skills or []) if student else 0
            ),

            "created_at": serialize_datetime(
                student.created_at if student else user.created_at
            )
        })

    return jsonify({
        "status": "success",
        "message": "Student directory retrieved successfully.",
        "count": len(results),
        "total": total,
        "page": page,
        "per_page": per_page,
        "students": results
    }), 200


# ==================================================
# ADMIN RECRUITER DIRECTORY
# GET /api/admin/recruiters
# ==================================================

@admin_bp.route("/recruiters", methods=["GET"])
@jwt_required()
def get_all_recruiters():

    admin, error = get_current_admin()

    if error:
        return error

    page, per_page = get_pagination()

    if page is None:
        return invalid_pagination_response()

    query = (
        User.query
        .filter_by(role="recruiter")
        .order_by(User.created_at.desc())
    )

    total = query.count()

    recruiters = (
        query
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    results = []

    for recruiter in recruiters:

        company = recruiter.company_profile

        results.append({
            "id": recruiter.id,
            "name": recruiter.name,
            "email": recruiter.email,
            "is_active": recruiter.is_active,

            "created_at": serialize_datetime(
                recruiter.created_at
            ),

            "company": {
                "id": company.id,
                "name": company.name,
                "industry": company.industry,
                "location": company.location,
                "website": company.website
            } if company else None
        })

    return jsonify({
        "status": "success",
        "count": len(results),
        "total": total,
        "page": page,
        "per_page": per_page,
        "recruiters": results
    }), 200


# ==================================================
# ADMIN JOB DIRECTORY
# GET /api/admin/jobs
# ==================================================

@admin_bp.route("/jobs", methods=["GET"])
@jwt_required()
def get_all_jobs():

    admin, error = get_current_admin()

    if error:
        return error

    page, per_page = get_pagination()

    if page is None:
        return invalid_pagination_response()

    application_counts = (
        db.session.query(
            Application.job_id.label("job_id"),
            func.count(Application.id).label("application_count")
        )
        .group_by(Application.job_id)
        .subquery()
    )

    query = (
        db.session.query(
            Job,
            Company.name.label("company_name"),
            func.coalesce(
                application_counts.c.application_count, 0
            ).label("application_count")
        )
        .join(
            Company,
            Job.company_id == Company.id
        )
        .outerjoin(
            application_counts,
            Job.id == application_counts.c.job_id
        )
        .order_by(Job.created_at.desc())
    )

    total = Job.query.count()

    rows = (
        query
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    results = []

    for job, company_name, application_count in rows:

        results.append({
            "id": job.id,
            "company_id": job.company_id,
            "company_name": company_name,
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills or [],
            "location": job.location,
            "job_type": job.job_type,
            "salary": job.salary,
            "min_cgpa": job.min_cgpa,
            "eligible_branches": job.eligible_branches or [],
            "graduation_year": job.graduation_year,

            "application_deadline": serialize_datetime(
                job.application_deadline
            ),

            "is_active": job.is_active,
            "application_count": application_count,

            "created_at": serialize_datetime(
                job.created_at
            )
        })

    return jsonify({
        "status": "success",
        "count": len(results),
        "total": total,
        "page": page,
        "per_page": per_page,
        "jobs": results
    }), 200


# ==================================================
# ADMIN APPLICATION DIRECTORY
# GET /api/admin/applications
# ==================================================

@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_all_applications():

    admin, error = get_current_admin()

    if error:
        return error

    page, per_page = get_pagination()

    if page is None:
        return invalid_pagination_response()

    # Retrieve applications with their associated
    # student, user, job and company records.

    query = (
        Application.query
        .join(
            Student,
            Application.student_id == Student.id
        )
        .join(
            User,
            Student.user_id == User.id
        )
        .join(
            Job,
            Application.job_id == Job.id
        )
        .join(
            Company,
            Job.company_id == Company.id
        )
        .order_by(Application.applied_at.desc())
    )

    total = query.count()

    application_records = (
        query
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    results = []

    for application in application_records:

        student = application.student
        student_user = student.user
        job = application.job
        company = job.company

        results.append({

            "id": application.id,

            "student_id": application.student_id,
            "job_id": application.job_id,

            "status": application.status,
            "match_score": application.match_score,

            "applied_at": serialize_datetime(
                application.applied_at
            ),

            "student": {
                "id": student.id,
                "user_id": student.user_id,
                "name": student_user.name,
                "email": student_user.email,
                "roll_number": student.roll_number,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "graduation_year": student.graduation_year
            },

            "job": {
                "id": job.id,
                "title": job.title,
                "company_name": company.name,
                "location": job.location,
                "job_type": job.job_type,
                "salary": job.salary
            }

        })

    return jsonify({
        "status": "success",
        "message": "Application directory retrieved successfully.",
        "count": len(results),
        "total": total,
        "page": page,
        "per_page": per_page,
        "applications": results
    }), 200


# ==================================================
# ACTIVATE / DEACTIVATE STUDENT OR RECRUITER
# PATCH /api/admin/users/<user_id>/status
# ==================================================

@admin_bp.route(
    "/users/<int:user_id>/status",
    methods=["PATCH"]
)
@jwt_required()
def update_user_status(user_id):

    admin, error = get_current_admin()

    if error:
        return error

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    target_user = db.session.get(User, user_id)

    if not target_user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    # Admin accounts cannot be managed through this endpoint.
    if target_user.role not in ("student", "recruiter"):
        return jsonify({
            "status": "error",
            "message": (
                "Only student and recruiter accounts "
                "can be managed here."
            )
        }), 403

    try:

        target_user.is_active = is_active

        db.session.commit()

        return jsonify({
            "status": "success",

            "message": (
                "Account activated successfully."
                if is_active
                else "Account deactivated successfully."
            ),

            "user": {
                "id": target_user.id,
                "name": target_user.name,
                "role": target_user.role,
                "is_active": target_user.is_active
            }
        }), 200

    except Exception as error:

        db.session.rollback()

        print("Admin user update error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to update user account."
        }), 500


# ==================================================
# ACTIVATE / DEACTIVATE JOB POSTING
# PATCH /api/admin/jobs/<job_id>/status
# ==================================================

@admin_bp.route(
    "/jobs/<int:job_id>/status",
    methods=["PATCH"]
)
@jwt_required()
def update_job_status(job_id):

    admin, error = get_current_admin()

    if error:
        return error

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON."
        }), 400

    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    job = db.session.get(Job, job_id)

    if not job:
        return jsonify({
            "status": "error",
            "message": "Job posting not found."
        }), 404

    try:

        job.is_active = is_active

        db.session.commit()

        return jsonify({
            "status": "success",

            "message": (
                "Job posting activated successfully."
                if is_active
                else "Job posting deactivated successfully."
            ),

            "job": {
                "id": job.id,
                "title": job.title,
                "is_active": job.is_active
            }
        }), 200

    except Exception as error:

        db.session.rollback()

        print("Admin job update error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to update job posting."
        }), 500

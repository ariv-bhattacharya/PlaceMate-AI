
from datetime import date
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Student, Project, Internship


profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api/profile"
)


# ==================================================
# AUTHENTICATION AND STUDENT ACCESS
# ==================================================

def get_logged_in_student():
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

    if user.role != "student":
        return None, (jsonify({
            "status": "error",
            "message": "Only students can access this feature."
        }), 403)

    student = Student.query.filter_by(user_id=user.id).first()

    if not student:
        return None, (jsonify({
            "status": "error",
            "message": "Student profile not found."
        }), 404)

    return student, None


# ==================================================
# VALIDATION HELPERS
# ==================================================

def parse_date(value, field_name):
    if value in (None, ""):
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must use YYYY-MM-DD format.")

    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{field_name} must use YYYY-MM-DD format.")


def validate_url(value, field_name):
    if value in (None, ""):
        return None

    if not isinstance(value, str) or len(value) > 500:
        raise ValueError(f"Invalid {field_name}.")

    value = value.strip()
    parsed = urlparse(value)

    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(f"{field_name} must be a valid HTTP or HTTPS URL.")

    return value


def validate_string_list(value, field_name):
    if value is None:
        return []

    if not isinstance(value, list):
        raise ValueError(f"{field_name} must be a list.")

    if len(value) > 50:
        raise ValueError(f"{field_name} cannot contain more than 50 items.")

    cleaned = []

    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ValueError(f"Every {field_name} item must be non-empty text.")

        item = item.strip()

        if len(item) > 100:
            raise ValueError(f"Each {field_name} item must be under 100 characters.")

        if item not in cleaned:
            cleaned.append(item)

    return cleaned


def validate_payload(data, kind, creating=False):
    if not isinstance(data, dict):
        raise ValueError("Please provide valid JSON data.")

    if kind == "project":
        allowed = {
            "title", "description", "technologies",
            "github_url", "live_url",
            "start_date", "end_date", "status"
        }
        required = ("title",)
        list_field = "technologies"
        statuses = ("ongoing", "completed")
        title_field = "title"
        title_limit = 200

    else:
        allowed = {
            "company_name", "role", "description",
            "skills_used", "start_date", "end_date", "status"
        }
        required = ("company_name", "role")
        list_field = "skills_used"
        statuses = ("applied", "ongoing", "completed")
        title_field = "company_name"
        title_limit = 200

    unknown = set(data) - allowed

    if unknown:
        raise ValueError(
            f"Unsupported fields: {', '.join(sorted(unknown))}"
        )

    if creating:
        missing = [
            field for field in required
            if not isinstance(data.get(field), str)
            or not data[field].strip()
        ]

        if missing:
            raise ValueError(
                f"Required fields missing: {', '.join(missing)}"
            )

    result = {}

    for field in required:
        if field in data:
            value = data[field]

            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{field} must be non-empty text.")

            if len(value.strip()) > title_limit:
                raise ValueError(f"{field} is too long.")

            result[field] = value.strip()

    if "description" in data:
        value = data["description"]

        if value is not None and not isinstance(value, str):
            raise ValueError("Description must be text.")

        if value and len(value) > 5000:
            raise ValueError("Description cannot exceed 5000 characters.")

        result["description"] = value.strip() if value else None

    if list_field in data:
        result[list_field] = validate_string_list(
            data[list_field], list_field
        )

    if kind == "project":
        if "github_url" in data:
            result["github_url"] = validate_url(
                data["github_url"], "GitHub URL"
            )

        if "live_url" in data:
            result["live_url"] = validate_url(
                data["live_url"], "Live project URL"
            )

    for field in ("start_date", "end_date"):
        if field in data:
            result[field] = parse_date(data[field], field)

    if "start_date" in result and "end_date" in result:
        if (
            result["start_date"]
            and result["end_date"]
            and result["end_date"] < result["start_date"]
        ):
            raise ValueError("End date cannot be before start date.")

    if "status" in data:
        status = data["status"]

        if not isinstance(status, str) or status not in statuses:
            raise ValueError(
                f"Status must be one of: {', '.join(statuses)}."
            )

        result["status"] = status

    return result


# ==================================================
# SERIALIZATION
# ==================================================

def serialize_record(record, kind):
    common = {
        "id": record.id,
        "student_id": record.student_id,
        "description": record.description,
        "start_date": (
            record.start_date.isoformat()
            if record.start_date else None
        ),
        "end_date": (
            record.end_date.isoformat()
            if record.end_date else None
        ),
        "status": record.status,
        "created_at": (
            record.created_at.isoformat()
            if record.created_at else None
        ),
        "updated_at": (
            record.updated_at.isoformat()
            if record.updated_at else None
        )
    }

    if kind == "project":
        common.update({
            "title": record.title,
            "technologies": record.technologies or [],
            "github_url": record.github_url,
            "live_url": record.live_url
        })
    else:
        common.update({
            "company_name": record.company_name,
            "role": record.role,
            "skills_used": record.skills_used or []
        })

    return common


# ==================================================
# GENERIC CRUD HANDLERS
# ==================================================

def list_records(model, kind):
    student, error = get_logged_in_student()

    if error:
        return error

    records = model.query.filter_by(
        student_id=student.id
    ).order_by(model.created_at.desc()).all()

    return jsonify({
        "status": "success",
        "count": len(records),
        "data": [serialize_record(item, kind) for item in records]
    }), 200


def create_record(model, kind):
    student, error = get_logged_in_student()

    if error:
        return error

    data = request.get_json(silent=True)

    try:
        values = validate_payload(data, kind, creating=True)

        record = model(
            student_id=student.id,
            **values
        )

        db.session.add(record)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"{kind.title()} added successfully.",
            "data": serialize_record(record, kind)
        }), 201

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": f"Unable to add {kind}."
        }), 500


def update_record(model, kind, record_id):
    student, error = get_logged_in_student()

    if error:
        return error

    record = model.query.filter_by(
        id=record_id,
        student_id=student.id
    ).first()

    if not record:
        return jsonify({
            "status": "error",
            "message": f"{kind.title()} not found."
        }), 404

    data = request.get_json(silent=True)

    try:
        values = validate_payload(data, kind)

        if not values:
            return jsonify({
                "status": "error",
                "message": "No valid information provided."
            }), 400

        for field, value in values.items():
            setattr(record, field, value)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"{kind.title()} updated successfully.",
            "data": serialize_record(record, kind)
        }), 200

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": f"Unable to update {kind}."
        }), 500


def delete_record(model, kind, record_id):
    student, error = get_logged_in_student()

    if error:
        return error

    record = model.query.filter_by(
        id=record_id,
        student_id=student.id
    ).first()

    if not record:
        return jsonify({
            "status": "error",
            "message": f"{kind.title()} not found."
        }), 404

    try:
        db.session.delete(record)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"{kind.title()} deleted successfully."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": f"Unable to delete {kind}."
        }), 500


# ==================================================
# PROJECT ENDPOINTS
# ==================================================

@profile_bp.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():
    return list_records(Project, "project")


@profile_bp.route("/projects", methods=["POST"])
@jwt_required()
def add_project():
    return create_record(Project, "project")


@profile_bp.route("/projects/<int:project_id>", methods=["PATCH"])
@jwt_required()
def edit_project(project_id):
    return update_record(Project, "project", project_id)


@profile_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
def remove_project(project_id):
    return delete_record(Project, "project", project_id)


# ==================================================
# INTERNSHIP ENDPOINTS
# ==================================================

@profile_bp.route("/internships", methods=["GET"])
@jwt_required()
def get_internships():
    return list_records(Internship, "internship")


@profile_bp.route("/internships", methods=["POST"])
@jwt_required()
def add_internship():
    return create_record(Internship, "internship")


@profile_bp.route("/internships/<int:internship_id>", methods=["PATCH"])
@jwt_required()
def edit_internship(internship_id):
    return update_record(Internship, "internship", internship_id)


@profile_bp.route("/internships/<int:internship_id>", methods=["DELETE"])
@jwt_required()
def remove_internship(internship_id):
    return delete_record(Internship, "internship", internship_id)

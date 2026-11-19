
from datetime import datetime

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    User,
    Student,
    Resume,
    CareerRoadmap,
    RoadmapTask,
    RoadmapProgress
)
from app.ai.roadmap_generator import generate_career_roadmap


roadmap_bp = Blueprint(
    "roadmaps",
    __name__,
    url_prefix="/api/roadmaps"
)


# ==================================================
# AUTHENTICATED STUDENT HELPER
# ==================================================

def get_authenticated_student():
    """Verify JWT identity and return the authenticated student."""

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, None, (
            jsonify({
                "status": "error",
                "message": "Invalid user identity."
            }),
            401
        )

    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return None, None, (
            jsonify({
                "status": "error",
                "message": "User not found or inactive."
            }),
            401
        )

    if user.role != "student":
        return None, None, (
            jsonify({
                "status": "error",
                "message": "Only students can access career roadmaps."
            }),
            403
        )

    student = Student.query.filter_by(
        user_id=user.id
    ).first()

    if not student:
        return None, None, (
            jsonify({
                "status": "error",
                "message": "Please complete your student profile first."
            }),
            404
        )

    return user, student, None


# ==================================================
# SERIALIZATION HELPERS
# ==================================================

def serialize_task(task):
    """Convert a roadmap task into JSON-safe data."""

    return {
        "id": task.id,
        "day_number": task.day_number,
        "week_number": task.week_number,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "estimated_minutes": task.estimated_minutes,
        "expected_deliverable": task.expected_deliverable,
        # Older roadmap tasks may not have learning resources yet.
        "learning_resources": task.learning_resources or [],
        "status": task.status,
        "due_date": (
            task.due_date.isoformat()
            if task.due_date else None
        ),
        "completed_at": (
            task.completed_at.isoformat()
            if task.completed_at else None
        )
    }


def serialize_roadmap(roadmap, include_tasks=False):
    """Convert a roadmap into JSON-safe data."""

    context = roadmap.generation_context or {}

    result = {
        "id": roadmap.id,
        "title": roadmap.title,
        "target_role": roadmap.target_role,
        "description": roadmap.description,
        "duration_days": roadmap.duration_days,
        "status": roadmap.status,

        "weekly_milestones": context.get(
            "weekly_milestones", []
        ),

        "created_at": (
            roadmap.created_at.isoformat()
            if roadmap.created_at else None
        ),

        "updated_at": (
            roadmap.updated_at.isoformat()
            if roadmap.updated_at else None
        ),

        "total_tasks": len(roadmap.tasks),

        "completed_tasks": sum(
            1 for task in roadmap.tasks
            if task.status == "completed"
        )
    }

    if include_tasks:
        result["tasks"] = [
            serialize_task(task)
            for task in roadmap.tasks
        ]

    return result


# ==================================================
# GENERATE ROADMAP
# ==================================================

@roadmap_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_roadmap():

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Please provide valid JSON data."
        }), 400

    target_role = data.get("target_role")
    duration_days = data.get("duration_days", 30)

    if not isinstance(target_role, str) or not target_role.strip():
        return jsonify({
            "status": "error",
            "message": "Please provide a target career role."
        }), 400

    target_role = target_role.strip()

    if len(target_role) > 150:
        return jsonify({
            "status": "error",
            "message": "Target role cannot exceed 150 characters."
        }), 400

    if (
        not isinstance(duration_days, int)
        or isinstance(duration_days, bool)
        or not 7 <= duration_days <= 180
    ):
        return jsonify({
            "status": "error",
            "message": "Duration must be between 7 and 180 days."
        }), 400

    resume = Resume.query.filter_by(
        student_id=student.id,
        is_active=True
    ).order_by(
        Resume.uploaded_at.desc()
    ).first()

    try:
        roadmap_data = generate_career_roadmap(
            student=student,
            target_role=target_role,
            duration_days=duration_days,
            resume=resume
        )

        roadmap = CareerRoadmap(
            student_id=student.id,
            title=roadmap_data["title"],
            target_role=target_role,
            description=roadmap_data["description"],
            duration_days=roadmap_data["duration_days"],
            status="draft",
            generation_context=roadmap_data["generation_context"]
        )

        db.session.add(roadmap)
        db.session.flush()

        for task_data in roadmap_data["tasks"]:

            task = RoadmapTask(
                roadmap_id=roadmap.id,
                day_number=task_data["day_number"],
                week_number=task_data["week_number"],
                title=task_data["title"],
                description=task_data["description"],
                category=task_data["category"],
                priority=task_data["priority"],
                estimated_minutes=task_data["estimated_minutes"],
                expected_deliverable=task_data["expected_deliverable"],
                learning_resources=task_data.get("learning_resources") or [],
                status="pending",
                sort_order=task_data["sort_order"]
            )

            db.session.add(task)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Career roadmap generated and saved successfully.",
            "roadmap": serialize_roadmap(
                roadmap,
                include_tasks=False
            )
        }), 201

    except ValueError as error:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except RuntimeError:
        db.session.rollback()

        current_app.logger.exception(
            "Career roadmap AI generation failed."
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to generate the roadmap right now. "
                "Please try again."
            )
        }), 502

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Unexpected career roadmap generation error."
        )

        return jsonify({
            "status": "error",
            "message": (
                "An unexpected error occurred while saving the roadmap."
            )
        }), 500


# ==================================================
# GET ALL STUDENT ROADMAPS
# ==================================================

@roadmap_bp.route("", methods=["GET"])
@jwt_required()
def get_roadmaps():

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    roadmaps = CareerRoadmap.query.filter_by(
        student_id=student.id
    ).order_by(
        CareerRoadmap.created_at.desc()
    ).all()

    return jsonify({
        "status": "success",
        "total": len(roadmaps),
        "roadmaps": [
            serialize_roadmap(roadmap)
            for roadmap in roadmaps
        ]
    }), 200


# ==================================================
# GET SINGLE ROADMAP WITH TASKS
# ==================================================

@roadmap_bp.route("/<int:roadmap_id>", methods=["GET"])
@jwt_required()
def get_roadmap(roadmap_id):

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    roadmap = CareerRoadmap.query.filter_by(
        id=roadmap_id,
        student_id=student.id
    ).first()

    if not roadmap:
        return jsonify({
            "status": "error",
            "message": "Career roadmap not found."
        }), 404

    return jsonify({
        "status": "success",
        "roadmap": serialize_roadmap(
            roadmap,
            include_tasks=True
        )
    }), 200


# ==================================================
# ACTIVATE CAREER ROADMAP
# ==================================================

@roadmap_bp.route(
    "/<int:roadmap_id>/activate",
    methods=["PATCH"]
)
@jwt_required()
def activate_roadmap(roadmap_id):

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    roadmap = CareerRoadmap.query.filter_by(
        id=roadmap_id,
        student_id=student.id
    ).first()

    if not roadmap:
        return jsonify({
            "status": "error",
            "message": "Career roadmap not found."
        }), 404

    if roadmap.status == "active":
        return jsonify({
            "status": "success",
            "message": "This roadmap is already active.",
            "roadmap": serialize_roadmap(roadmap)
        }), 200

    if roadmap.status == "completed":
        return jsonify({
            "status": "error",
            "message": "A completed roadmap cannot be activated."
        }), 409

    if roadmap.status == "archived":
        # Archived roadmaps can be reactivated.
        pass

    try:
        # Archive any previously active roadmap.
        CareerRoadmap.query.filter(
            CareerRoadmap.student_id == student.id,
            CareerRoadmap.status == "active",
            CareerRoadmap.id != roadmap.id
        ).update(
            {"status": "archived"},
            synchronize_session=False
        )

        roadmap.status = "active"

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Career roadmap activated successfully.",
            "roadmap": serialize_roadmap(roadmap)
        }), 200

    except IntegrityError:
        db.session.rollback()

        current_app.logger.warning(
            "Roadmap activation conflict for student %s.",
            student.id
        )

        return jsonify({
            "status": "error",
            "message": (
                "Another roadmap activation is in progress. "
                "Please refresh and try again."
            )
        }), 409

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Career roadmap activation failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to activate the roadmap right now."
        }), 500


# ==================================================
# UPDATE ROADMAP TASK STATUS
# ==================================================

@roadmap_bp.route(
    "/tasks/<int:task_id>",
    methods=["PATCH"]
)
@jwt_required()
def update_task_status(task_id):

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Please provide valid JSON data."
        }), 400

    new_status = data.get("status")

    allowed_statuses = {
        "pending",
        "in_progress",
        "completed",
        "skipped"
    }

    if (
        not isinstance(new_status, str)
        or new_status not in allowed_statuses
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid task status.",
            "allowed_statuses": sorted(allowed_statuses)
        }), 400

    # Verify task ownership through the parent roadmap.
    task = RoadmapTask.query.join(
        CareerRoadmap,
        RoadmapTask.roadmap_id == CareerRoadmap.id
    ).filter(
        RoadmapTask.id == task_id,
        CareerRoadmap.student_id == student.id
    ).first()

    if not task:
        return jsonify({
            "status": "error",
            "message": "Roadmap task not found."
        }), 404

    old_status = task.status

    if old_status == new_status:
        return jsonify({
            "status": "success",
            "message": "Task already has this status.",
            "task": serialize_task(task)
        }), 200

    try:
        # Update task status.
        task.status = new_status

        if new_status == "completed":
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

        # Calculate updated completion percentage.
        total_tasks = len(task.roadmap.tasks)

        completed_tasks = sum(
            1 for roadmap_task in task.roadmap.tasks
            if roadmap_task.status == "completed"
        )

        completion_percentage = (
            round(
                (completed_tasks / total_tasks) * 100,
                2
            )
            if total_tasks > 0 else 0
        )

        # Create a progress history event.
        if new_status == "completed":
            event_type = "task_completed"

        elif new_status == "in_progress":
            event_type = "task_started"

        else:
            event_type = "task_status_changed"

        progress_entry = RoadmapProgress(
            roadmap_id=task.roadmap_id,
            task_id=task.id,
            event_type=event_type,
            note=(
                f"Task status changed from "
                f"{old_status} to {new_status}."
            ),
            completion_percentage=completion_percentage,
            extra_data={
                "previous_status": old_status,
                "new_status": new_status
            }
        )

        db.session.add(progress_entry)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Task status updated successfully.",
            "task": serialize_task(task),
            "progress": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "completion_percentage": completion_percentage
            }
        }), 200

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Roadmap task status update failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to update task status right now."
        }), 500
    
# ==================================================
# GET ROADMAP PROGRESS SUMMARY AND HISTORY
# ==================================================

@roadmap_bp.route(
    "/<int:roadmap_id>/progress",
    methods=["GET"]
)
@jwt_required()
def get_roadmap_progress(roadmap_id):

    user, student, error_response = get_authenticated_student()

    if error_response:
        return error_response

    # Verify roadmap ownership.
    roadmap = CareerRoadmap.query.filter_by(
        id=roadmap_id,
        student_id=student.id
    ).first()

    if not roadmap:
        return jsonify({
            "status": "error",
            "message": "Career roadmap not found."
        }), 404

    try:
        tasks = roadmap.tasks

        total_tasks = len(tasks)

        # Calculate task status counts.
        task_counts = {
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "skipped": 0
        }

        weekly_progress = {}

        for task in tasks:

            status = task.status

            if status in task_counts:
                task_counts[status] += 1

            week = task.week_number or 1

            if week not in weekly_progress:
                weekly_progress[week] = {
                    "week_number": week,
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "pending_tasks": 0,
                    "in_progress_tasks": 0,
                    "skipped_tasks": 0
                }

            weekly_progress[week]["total_tasks"] += 1

            if status == "completed":
                weekly_progress[week]["completed_tasks"] += 1

            elif status == "pending":
                weekly_progress[week]["pending_tasks"] += 1

            elif status == "in_progress":
                weekly_progress[week]["in_progress_tasks"] += 1

            elif status == "skipped":
                weekly_progress[week]["skipped_tasks"] += 1

        completed_tasks = task_counts["completed"]

        completion_percentage = (
            round((completed_tasks / total_tasks) * 100, 2)
            if total_tasks > 0 else 0
        )

        # Calculate weekly completion percentages.
        weekly_results = []

        for week_data in sorted(
            weekly_progress.values(),
            key=lambda item: item["week_number"]
        ):

            week_total = week_data["total_tasks"]
            week_completed = week_data["completed_tasks"]

            week_data["completion_percentage"] = (
                round((week_completed / week_total) * 100, 2)
                if week_total > 0 else 0
            )

            weekly_results.append(week_data)

        # Retrieve recent progress history.
        history_entries = RoadmapProgress.query.filter_by(
            roadmap_id=roadmap.id
        ).order_by(
            RoadmapProgress.created_at.desc(),
            RoadmapProgress.id.desc()
        ).limit(20).all()

        history = []

        for entry in history_entries:

            history.append({
                "id": entry.id,
                "task_id": entry.task_id,
                "event_type": entry.event_type,
                "note": entry.note,
                "completion_percentage": entry.completion_percentage,
                "extra_data": entry.extra_data,
                "created_at": (
                    entry.created_at.isoformat()
                    if entry.created_at else None
                )
            })

        return jsonify({
            "status": "success",
            "roadmap": {
                "id": roadmap.id,
                "title": roadmap.title,
                "target_role": roadmap.target_role,
                "status": roadmap.status
            },
            "overall_progress": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "pending_tasks": task_counts["pending"],
                "in_progress_tasks": task_counts["in_progress"],
                "skipped_tasks": task_counts["skipped"],
                "completion_percentage": completion_percentage
            },
            "weekly_progress": weekly_results,
            "recent_activity": history
        }), 200

    except Exception:

        current_app.logger.exception(
            "Roadmap progress retrieval failed."
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve roadmap progress."
        }), 500


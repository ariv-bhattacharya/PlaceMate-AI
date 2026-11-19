
from datetime import datetime

from sqlalchemy import Index, text

from app.extensions import db


class CareerRoadmap(db.Model):
    __tablename__ = "career_roadmaps"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = db.Column(db.String(150), nullable=False)
    target_role = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)

    duration_days = db.Column(db.Integer)

    # draft, active, completed, archived
    status = db.Column(
        db.String(20),
        nullable=False,
        default="draft"
    )

    # Stores the profile/context used to generate this roadmap.
    generation_context = db.Column(db.JSON)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    student = db.relationship(
        "Student",
        backref="career_roadmaps"
    )

    tasks = db.relationship(
        "RoadmapTask",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        order_by="RoadmapTask.sort_order"
    )

    progress_entries = db.relationship(
        "RoadmapProgress",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        order_by="RoadmapProgress.created_at"
    )

    __table_args__ = (
        # A student can have only one active roadmap at a time.
        Index(
            "uq_one_active_roadmap_per_student",
            "student_id",
            unique=True,
            postgresql_where=text("status = 'active'")
        ),
    )


class RoadmapTask(db.Model):
    __tablename__ = "roadmap_tasks"

    id = db.Column(db.Integer, primary_key=True)

    roadmap_id = db.Column(
        db.Integer,
        db.ForeignKey("career_roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    day_number = db.Column(db.Integer)
    week_number = db.Column(db.Integer)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    category = db.Column(db.String(100))

    priority = db.Column(
        db.String(20),
        nullable=False,
        default="medium"
    )

    estimated_minutes = db.Column(db.Integer)
    expected_deliverable = db.Column(db.Text)

    # Learning resources associated with this task.
    # Stores a list of resource dictionaries in JSON format.
    learning_resources = db.Column(
        db.JSON,
        nullable=True,
        default=list
    )

    # pending, in_progress, completed, skipped
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    due_date = db.Column(db.Date)
    completed_at = db.Column(db.DateTime)

    sort_order = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    roadmap = db.relationship(
        "CareerRoadmap",
        back_populates="tasks"
    )

    progress_entries = db.relationship(
        "RoadmapProgress",
        back_populates="task"
    )


class RoadmapProgress(db.Model):
    __tablename__ = "roadmap_progress"

    id = db.Column(db.Integer, primary_key=True)

    roadmap_id = db.Column(
        db.Integer,
        db.ForeignKey("career_roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    task_id = db.Column(
        db.Integer,
        db.ForeignKey("roadmap_tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Examples: task_completed, task_started, feedback, roadmap_updated
    event_type = db.Column(
        db.String(50),
        nullable=False
    )

    note = db.Column(db.Text)

    # Optional snapshot of progress at the time of this event.
    completion_percentage = db.Column(db.Float)

    extra_data = db.Column(db.JSON)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    roadmap = db.relationship(
        "CareerRoadmap",
        back_populates="progress_entries"
    )

    task = db.relationship(
        "RoadmapTask",
        back_populates="progress_entries"
    )


from datetime import datetime

from app.extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)

    description = db.Column(db.Text)

    technologies = db.Column(
        db.JSON,
        nullable=False,
        default=list
    )

    github_url = db.Column(db.String(500))

    live_url = db.Column(db.String(500))

    start_date = db.Column(db.Date)

    end_date = db.Column(db.Date)

    status = db.Column(
        db.String(30),
        nullable=False,
        default="completed"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    student = db.relationship(
        "Student",
        back_populates="projects"
    )

    def __repr__(self):
        return f"<Project {self.title}>"

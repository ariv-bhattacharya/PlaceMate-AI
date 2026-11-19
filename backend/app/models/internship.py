
from datetime import datetime

from app.extensions import db


class Internship(db.Model):
    __tablename__ = "internships"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    company_name = db.Column(db.String(200), nullable=False)

    role = db.Column(db.String(150), nullable=False)

    description = db.Column(db.Text)

    skills_used = db.Column(
        db.JSON,
        nullable=False,
        default=list
    )

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
        back_populates="internships"
    )

    def __repr__(self):
        return f"<Internship {self.company_name} - {self.role}>"

from datetime import datetime
from app.extensions import db


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id"),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="applied"
    )

    # AI-generated resume/job match score
    match_score = db.Column(db.Float)

    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Prevent the same student applying to the same job twice
    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "job_id",
            name="unique_student_job_application"
        ),
    )

    student = db.relationship("Student", back_populates="applications")
    job = db.relationship("Job", back_populates="applications")

    recruitment_rounds = db.relationship(
        "RecruitmentRound",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="RecruitmentRound.round_number"
    )

    def __repr__(self):
        return f"<Application {self.id} - {self.status}>"
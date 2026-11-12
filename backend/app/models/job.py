from datetime import datetime
from app.extensions import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id"),
        nullable=False
    )

    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON, default=list)

    location = db.Column(db.String(150))
    job_type = db.Column(db.String(50))
    salary = db.Column(db.String(100))

    min_cgpa = db.Column(db.Float)
    eligible_branches = db.Column(db.JSON, default=list)
    graduation_year = db.Column(db.Integer)

    application_deadline = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    company = db.relationship("Company", back_populates="jobs")

    applications = db.relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Job {self.title}>"
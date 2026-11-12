from datetime import datetime
from app.extensions import db


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)

    recruiter_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True
    )

    name = db.Column(db.String(150), nullable=False)
    industry = db.Column(db.String(100))
    description = db.Column(db.Text)
    website = db.Column(db.String(255))
    location = db.Column(db.String(150))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recruiter = db.relationship(
        "User",
        back_populates="company_profile"
    )

    jobs = db.relationship(
        "Job",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Company {self.name}>"
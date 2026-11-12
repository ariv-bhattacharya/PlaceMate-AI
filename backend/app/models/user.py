from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Allowed roles: student, recruiter, admin
    role = db.Column(db.String(20), nullable=False, default="student")

    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    student_profile = db.relationship(
        "Student",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    company_profile = db.relationship(
        "Company",
        back_populates="recruiter",
        uselist=False
    )

    def __repr__(self):
        return f"<User {self.email}>"
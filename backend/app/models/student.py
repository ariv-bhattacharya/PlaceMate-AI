from datetime import datetime
from app.extensions import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    roll_number = db.Column(db.String(30), unique=True)
    branch = db.Column(db.String(100))
    graduation_year = db.Column(db.Integer)

    cgpa = db.Column(db.Float)
    tenth_percentage = db.Column(db.Float)
    twelfth_percentage = db.Column(db.Float)

    phone = db.Column(db.String(20))
    location = db.Column(db.String(120))

    # Store skills as a JSON list, for example ["Python", "SQL"]
    skills = db.Column(db.JSON, default=list)

    linkedin_url = db.Column(db.String(255))
    github_url = db.Column(db.String(255))
    portfolio_url = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="student_profile")

    applications = db.relationship(
        "Application",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    resumes = db.relationship(
        "Resume",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Student {self.roll_number}>"
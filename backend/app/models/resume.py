from datetime import datetime
from app.extensions import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)

    parsed_text = db.Column(db.Text)

    # Extracted by the AI resume parser
    extracted_skills = db.Column(db.JSON, default=list)

    # Optional overall resume analysis score
    resume_score = db.Column(db.Float)

    is_active = db.Column(db.Boolean, default=True, nullable=False)

    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship("Student", back_populates="resumes")

    def __repr__(self):
        return f"<Resume {self.file_name}>"
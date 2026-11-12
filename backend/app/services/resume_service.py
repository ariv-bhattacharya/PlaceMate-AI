
import os
import uuid

from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.student import Student
from app.models.resume import Resume
from app.ai.resume_parser import parse_resume


ALLOWED_EXTENSIONS = {"pdf", "txt"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def save_and_parse_resume(uploaded_file, user_id):
    """
    Save an uploaded resume, parse its content,
    and store the extracted information in PostgreSQL.
    """

    if not uploaded_file or not uploaded_file.filename:
        raise ValueError("Please select a resume file.")

    original_filename = secure_filename(uploaded_file.filename)

    if not original_filename:
        raise ValueError("Invalid filename.")

    extension = original_filename.rsplit(".", 1)[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only PDF and TXT files are supported.")

    # Check file size
    uploaded_file.stream.seek(0, os.SEEK_END)
    file_size = uploaded_file.stream.tell()
    uploaded_file.stream.seek(0)

    if file_size == 0:
        raise ValueError("The uploaded file is empty.")

    if file_size > MAX_FILE_SIZE:
        raise ValueError("Resume size must not exceed 5 MB.")

    # Find or create the student's profile
    student = Student.query.filter_by(user_id=user_id).first()

    if not student:
        student = Student(user_id=user_id)
        db.session.add(student)
        db.session.flush()

    # Generate a unique filename to avoid overwriting files
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"

    upload_directory = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "uploads",
            "resumes"
        )
    )

    os.makedirs(upload_directory, exist_ok=True)

    file_path = os.path.join(upload_directory, unique_filename)

    try:
        # Save the uploaded file
        uploaded_file.save(file_path)

        # Parse the resume using the existing AI module
        parsed_result = parse_resume(file_path)

        if not parsed_result.get("success"):
            raise ValueError("Could not extract text from the resume.")

        extracted_skills = parsed_result.get("skills", [])
        parsed_text = parsed_result.get("text", "")

        # Save resume information in PostgreSQL
        resume = Resume(
            student_id=student.id,
            file_name=original_filename,
            file_path=file_path,
            parsed_text=parsed_text,
            extracted_skills=extracted_skills,
            is_active=True
        )

        db.session.add(resume)

        # Update the student's skill profile
        existing_skills = student.skills or []

        combined_skills = {
            skill.lower(): skill
            for skill in existing_skills + extracted_skills
        }

        student.skills = list(combined_skills.values())

        db.session.commit()

        return {
            "resume_id": resume.id,
            "file_name": resume.file_name,
            "file_type": parsed_result.get("file_type"),
            "word_count": parsed_result.get("word_count"),
            "extracted_skills": extracted_skills,
            "total_skills": len(extracted_skills)
        }

    except Exception:
        db.session.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise

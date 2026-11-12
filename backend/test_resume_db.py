
from app import create_app
from app.models.resume import Resume

app = create_app()

with app.app_context():

    resume = Resume.query.filter_by(
        file_name="ishita.pdf"
    ).order_by(Resume.uploaded_at.desc()).first()

    if resume:
        print("\n===== RESUME DATABASE VERIFICATION =====")
        print("Resume ID:", resume.id)
        print("File Name:", resume.file_name)
        print("File Path:", resume.file_path)
        print("Student ID:", resume.student_id)
        print("Parsed Text Length:", len(resume.parsed_text or ""))
        print("Extracted Skills:", resume.extracted_skills)
        print("Total Skills:", len(resume.extracted_skills or []))
        print("Active:", resume.is_active)

        print("\n===== STUDENT PROFILE =====")
        print("Student Skills:", resume.student.skills)
    else:
        print("Resume record not found in PostgreSQL.")

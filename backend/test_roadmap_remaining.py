from app import create_app
from app.models import Student, Resume
from app.ai.roadmap_generator import generate_career_roadmap

app = create_app()

with app.app_context():
    student = Student.query.first()
    resume = Resume.query.filter_by(
        student_id=student.id,
        is_active=True
    ).order_by(Resume.uploaded_at.desc()).first()

    result = generate_career_roadmap(
        student=student,
        target_role="Data Analyst",
        duration_days=30,
        resume=resume
    )

    for task in result.get("tasks", [])[10:]:
        print(
            "Day", task["day_number"],
            ":", task["title"],
            "|", task["expected_deliverable"]
        )

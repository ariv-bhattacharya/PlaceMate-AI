from app import create_app
from app.models import Student, Resume
from app.ai.roadmap_generator import generate_career_roadmap

app = create_app()

with app.app_context():
    student = Student.query.first()

    if not student:
        print("No student found.")
    else:
        resume = (
            Resume.query
            .filter_by(student_id=student.id, is_active=True)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )

        result = generate_career_roadmap(
            student=student,
            target_role="Data Analyst",
            duration_days=30,
            resume=resume
        )

        print("\nTITLE:", result.get("title"))
        print("DURATION:", result.get("duration_days"))
        print("TOTAL TASKS:", len(result.get("tasks", [])))

        print("\nSKILL GAPS:")
        print(result.get("generation_context", {}).get("skill_gap_analysis", {}))

        print("\nWEEKLY MILESTONES:")
        for milestone in result.get("weekly_milestones", []):
            print(milestone)

        print("\nFIRST 10 TASKS:")
        for task in result.get("tasks", [])[:10]:
            print(
                "Day", task["day_number"],
                ":", task["title"],
                "|", task["estimated_minutes"], "min",
                "|", task["expected_deliverable"]
            )

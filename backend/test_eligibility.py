from types import SimpleNamespace
from datetime import datetime, timedelta
from app.services.eligibility_service import check_job_eligibility

def create_job():
    return SimpleNamespace(
        title="Data Analyst",
        min_cgpa=7.5,
        graduation_year=2027,
        eligible_branches=[
            "Computer Science and Engineering",
            "Information Technology"
        ],
        application_deadline=datetime.now() + timedelta(days=10),
        is_active=True
    )

def test_low_cgpa():
    student = SimpleNamespace(
        cgpa=6.5,
        graduation_year=2027,
        branch="Computer Science and Engineering"
    )
    result = check_job_eligibility(student, create_job())
    print("\nLOW CGPA TEST:", result)

def test_wrong_branch():
    student = SimpleNamespace(
        cgpa=8.5,
        graduation_year=2027,
        branch="Mechanical Engineering"
    )
    result = check_job_eligibility(student, create_job())
    print("\nWRONG BRANCH TEST:", result)

def test_expired_deadline():
    student = SimpleNamespace(
        cgpa=8.5,
        graduation_year=2027,
        branch="Computer Science and Engineering"
    )
    job = create_job()
    job.application_deadline = datetime.now() - timedelta(days=2)

    result = check_job_eligibility(student, job)
    print("\nEXPIRED DEADLINE TEST:", result)

test_low_cgpa()
test_wrong_branch()
test_expired_deadline()
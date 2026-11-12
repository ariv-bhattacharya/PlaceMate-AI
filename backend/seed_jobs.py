
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import Company, Job


app = create_app()

with app.app_context():

    # Create sample companies
    companies_data = [
        {
            "name": "TechNova Solutions",
            "industry": "Information Technology",
            "description": "A sample technology company for PlaceMate AI testing.",
            "website": "https://example.com",
            "location": "Bengaluru"
        },
        {
            "name": "DataSphere Analytics",
            "industry": "Data Analytics",
            "description": "A sample analytics company for placement testing.",
            "website": "https://example.org",
            "location": "Hyderabad"
        }
    ]

    companies = {}

    for company_data in companies_data:
        company = Company.query.filter_by(
            name=company_data["name"]
        ).first()

        if not company:
            company = Company(**company_data)
            db.session.add(company)
            db.session.flush()
            print("Created company:", company.name)
        else:
            print("Company already exists:", company.name)

        companies[company.name] = company

    # Create sample jobs
    jobs_data = [
        {
            "company": "DataSphere Analytics",
            "title": "Junior Data Analyst",
            "description": (
                "Analyze datasets, create dashboards, "
                "prepare reports and identify business trends."
            ),
            "required_skills": [
                "Python", "SQL", "Excel", "Power BI", "Pandas"
            ],
            "location": "Hyderabad",
            "job_type": "Full-time",
            "salary": "5-7 LPA",
            "min_cgpa": None,
            "eligible_branches": [],
            "graduation_year": None
        },
        {
            "company": "TechNova Solutions",
            "title": "Business Analyst",
            "description": (
                "Work with business teams, analyze requirements "
                "and prepare data-driven reports."
            ),
            "required_skills": [
                "SQL", "Excel", "Power BI", "Communication"
            ],
            "location": "Bengaluru",
            "job_type": "Full-time",
            "salary": "6-8 LPA",
            "min_cgpa": 7.0,
            "eligible_branches": [
                "Computer Science and Engineering",
                "Information Technology"
            ],
            "graduation_year": 2027
        },
        {
            "company": "TechNova Solutions",
            "title": "AI/ML Intern",
            "description": (
                "Assist in developing machine learning models "
                "and evaluating AI solutions."
            ),
            "required_skills": [
                "Python", "Machine Learning", "Pandas",
                "Scikit-learn"
            ],
            "location": "Bengaluru",
            "job_type": "Internship",
            "salary": "15000/month",
            "min_cgpa": 8.0,
            "eligible_branches": [
                "Computer Science and Engineering"
            ],
            "graduation_year": 2027
        }
    ]

    for job_data in jobs_data:
        company_name = job_data.pop("company")
        company = companies[company_name]

        existing_job = Job.query.filter_by(
            company_id=company.id,
            title=job_data["title"]
        ).first()

        if existing_job:
            print("Job already exists:", existing_job.title)
            continue

        job = Job(
            company_id=company.id,
            application_deadline=datetime.now() + timedelta(days=30),
            is_active=True,
            **job_data
        )

        db.session.add(job)
        print("Created job:", job.title)

    db.session.commit()

    print("\n================================")
    print("SAMPLE DATA CREATED SUCCESSFULLY")
    print("Companies:", Company.query.count())
    print("Jobs:", Job.query.count())
    print("================================")

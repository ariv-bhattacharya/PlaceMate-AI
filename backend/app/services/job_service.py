
from app.models import Job, Resume
from app.ai.similarity_engine import compare_resume_to_jd


def get_active_jobs():
    """Return all currently active jobs."""
    return (
        Job.query
        .filter_by(is_active=True)
        .order_by(Job.created_at.desc())
        .all()
    )


def get_job_by_id(job_id):
    """Return a job by its ID."""
    return Job.query.get(job_id)


def get_latest_active_resume(student_id):
    """Get the latest active resume uploaded by a student."""
    return (
        Resume.query
        .filter_by(
            student_id=student_id,
            is_active=True
        )
        .order_by(Resume.uploaded_at.desc())
        .first()
    )


def calculate_resume_match(resume, job):
    """Compare a student's uploaded resume with a job."""

    if not resume:
        return {
            "available": False,
            "message": "Please upload your resume to calculate the match score."
        }

    resume_data = {
        "text": resume.parsed_text or "",
        "skills": resume.extracted_skills or []
    }

    job_data = {
        "text": job.description or "",
        "required_skills": job.required_skills or [],
        "preferred_skills": []
    }

    result = compare_resume_to_jd(
        resume_data,
        job_data
    )

    if not result.get("success"):
        return {
            "available": False,
            "message": result.get(
                "message",
                "Unable to calculate resume match."
            )
        }

    return {
        "available": True,
        "match_score": result["match_score"],
        "required_skill_score": result["required_skill_score"],
        "text_similarity_score": result["text_similarity_score"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "matched_required_skills": result["matched_required_skills"],
        "missing_required_skills": result["missing_required_skills"]
    }


def serialize_job(job):
    """Convert a Job model object into JSON-friendly data."""

    return {
        "id": job.id,

        # Company information
        "company_id": job.company_id,
        "company_name": (
            job.company.name if job.company else "Unknown Company"
        ),

        # Job information
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "location": job.location,
        "job_type": job.job_type,
        "salary": job.salary,

        # Eligibility requirements
        "min_cgpa": job.min_cgpa,
        "eligible_branches": job.eligible_branches or [],
        "graduation_year": job.graduation_year,

        # Application information
        "application_deadline": (
            job.application_deadline.isoformat()
            if job.application_deadline else None
        ),
        "is_active": job.is_active,

        # Timestamps
        "created_at": (
            job.created_at.isoformat()
            if job.created_at else None
        )
    }

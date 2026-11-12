
from datetime import datetime, date
import re


# --------------------------------------------------
# BRANCH NAME NORMALIZATION
# --------------------------------------------------

BRANCH_ALIASES = {
    # Computer Science
    "cse": "cse",
    "computer science": "cse",
    "computer science engineering": "cse",
    "computer science and engineering": "cse",

    # Information Technology
    "it": "it",
    "information technology": "it",
    "information tech": "it",

    # Electronics and Communication
    "ece": "ece",
    "electronics and communication": "ece",
    "electronics and communication engineering": "ece",
    "electronics communication engineering": "ece",

    # Electrical and Electronics
    "eee": "eee",
    "electrical and electronics": "eee",
    "electrical and electronics engineering": "eee",

    # Electrical Engineering
    "ee": "ee",
    "electrical engineering": "ee",

    # Mechanical Engineering
    "me": "me",
    "mechanical": "me",
    "mechanical engineering": "me",

    # Civil Engineering
    "ce": "ce",
    "civil": "ce",
    "civil engineering": "ce",

    # Artificial Intelligence and Machine Learning
    "aiml": "aiml",
    "ai ml": "aiml",
    "ai and ml": "aiml",
    "artificial intelligence and machine learning": "aiml",

    # Data Science
    "ds": "ds",
    "data science": "ds",
    "data science and engineering": "ds",

    # Information Science
    "ise": "ise",
    "information science": "ise",
    "information science and engineering": "ise",
}


def normalize_branch(branch):
    """
    Normalize branch names so equivalent names match.

    Examples:
        Computer Science and Engineering -> cse
        CSE -> cse
        Information Technology -> it
        IT -> it
    """

    if not branch:
        return ""

    normalized = str(branch).strip().lower()

    # Replace symbols and repeated spaces with one space.
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = " ".join(normalized.split())

    return BRANCH_ALIASES.get(normalized, normalized)


# --------------------------------------------------
# JOB ELIGIBILITY CHECK
# --------------------------------------------------

def check_job_eligibility(student, job):
    """
    Check whether a student meets the eligibility
    criteria for a particular job.

    Checks:
        1. Job active status
        2. Application deadline
        3. Minimum CGPA
        4. Graduation year
        5. Eligible branch

    Returns eligibility status and reasons.
    """

    reasons = []

    # 1. Check whether the job is active.
    if not job.is_active:
        reasons.append("This job is currently inactive.")

    # 2. Check application deadline.
    if job.application_deadline:
        deadline = job.application_deadline

        if isinstance(deadline, datetime):
            deadline = deadline.date()

        if deadline < date.today():
            reasons.append("Application deadline has passed.")

    # 3. Check minimum CGPA.
    if job.min_cgpa is not None:
        if student.cgpa is None:
            reasons.append("Student CGPA is not provided.")

        elif student.cgpa < job.min_cgpa:
            reasons.append(
                f"Minimum CGPA required is {job.min_cgpa}, "
                f"but your CGPA is {student.cgpa}."
            )

    # 4. Check graduation year.
    if job.graduation_year is not None:
        if student.graduation_year is None:
            reasons.append("Graduation year is not provided.")

        elif student.graduation_year != job.graduation_year:
            reasons.append(
                f"This job is for the {job.graduation_year} graduating batch."
            )

    # 5. Check eligible branches using normalized names.
    eligible_branches = job.eligible_branches or []

    if eligible_branches:
        if not student.branch:
            reasons.append("Student branch is not provided.")

        else:
            student_branch = normalize_branch(student.branch)

            normalized_eligible_branches = {
                normalize_branch(branch)
                for branch in eligible_branches
                if branch
            }

            if student_branch not in normalized_eligible_branches:
                reasons.append(
                    "Your branch is not eligible for this job."
                )

    is_eligible = len(reasons) == 0

    return {
        "is_eligible": is_eligible,
        "status": "Eligible" if is_eligible else "Not Eligible",
        "reasons": reasons
    }


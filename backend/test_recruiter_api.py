
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

print("\n===== PlaceMate AI - Recruiter Job Creation Test =====")

email = input("Recruiter email: ").strip()
password = getpass("Recruiter password: ")

# 1. Recruiter login
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "email": email,
        "password": password
    },
    timeout=15
)

print("\nLogin Status:", login_response.status_code)

if login_response.status_code != 200:
    print(login_response.json())
    raise SystemExit("Login failed.")

login_data = login_response.json()
token = login_data["access_token"]

if login_data["user"]["role"] != "recruiter":
    raise SystemExit("This account is not a recruiter.")

headers = {
    "Authorization": f"Bearer {token}"
}

print("Recruiter login successful!")

# 2. Get existing recruiter jobs
jobs_response = requests.get(
    f"{BASE_URL}/api/recruiter/jobs",
    headers=headers,
    timeout=15
)

if jobs_response.status_code != 200:
    print(jobs_response.json())
    raise SystemExit("Unable to retrieve recruiter jobs.")

jobs_data = jobs_response.json()

print("\nCompany:", jobs_data["company"]["name"])
print("Existing Jobs:", jobs_data["count"])

# 3. Avoid creating the same test job twice
job_title = "Junior Data Analyst - Recruiter Demo"

existing_job = next(
    (
        job for job in jobs_data["jobs"]
        if job["title"] == job_title
    ),
    None
)

if existing_job:
    print("\nTest job already exists.")
    print("Job ID:", existing_job["id"])

else:
    # 4. Create a new job
    job_payload = {
        "title": job_title,
        "description": (
            "We are looking for a Junior Data Analyst to analyze "
            "business datasets, prepare reports, create dashboards "
            "and communicate data-driven insights. Candidates should "
            "have knowledge of Python, SQL, Excel and Power BI."
        ),
        "required_skills": [
            "Python",
            "SQL",
            "Excel",
            "Power BI",
            "Communication"
        ],
        "location": "Bhubaneswar",
        "job_type": "Full-time",
        "salary": "5-7 LPA",
        "min_cgpa": 7.0,
        "eligible_branches": ["CSE", "IT"],
        "graduation_year": 2027,
        "application_deadline": "2026-12-31T23:59:00"
    }

    create_response = requests.post(
        f"{BASE_URL}/api/recruiter/jobs",
        headers=headers,
        json=job_payload,
        timeout=15
    )

    print("\nJob Creation Status:", create_response.status_code)
    print("Response:", create_response.json())

    if create_response.status_code != 201:
        raise SystemExit("Job creation failed.")

    created_job = create_response.json()["job"]

    print("\n===== JOB CREATED SUCCESSFULLY =====")
    print("Job ID:", created_job["id"])
    print("Job Title:", created_job["title"])
    print("Company:", created_job["company_name"])

# 5. Verify recruiter job list
verify_response = requests.get(
    f"{BASE_URL}/api/recruiter/jobs",
    headers=headers,
    timeout=15
)

print("\n===== FINAL VERIFICATION =====")
print("Status:", verify_response.status_code)

if verify_response.status_code == 200:
    result = verify_response.json()
    print("Company:", result["company"]["name"])
    print("Total Jobs:", result["count"])

    for job in result["jobs"]:
        print(
            f"Job ID: {job['id']} | "
            f"Title: {job['title']} | "
            f"Active: {job['is_active']}"
        )

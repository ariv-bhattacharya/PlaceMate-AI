
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"
TEST_JOB_ID = 1  # Junior Data Analyst


def print_response_error(response):
    try:
        print(response.json())
    except ValueError:
        print(response.text)


print("\n===== PLACEMATE AI APPLICATION API TEST =====")

# 1. LOGIN
email = input("Enter your registered email: ")
password = getpass("Enter your password: ")

try:
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
        print_response_error(login_response)
        raise SystemExit("Login failed.")

    token = login_response.json().get("access_token")

    if not token:
        raise SystemExit("Access token was not returned.")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 2. DISPLAY JOBS AND THEIR IDS
    print("\n========== AVAILABLE JOBS ==========")

    jobs_response = requests.get(
        f"{BASE_URL}/api/jobs/",
        headers=headers,
        timeout=15
    )

    print("Jobs API Status:", jobs_response.status_code)

    if jobs_response.status_code != 200:
        print_response_error(jobs_response)
        raise SystemExit("Unable to retrieve jobs.")

    jobs = jobs_response.json().get("jobs", [])

    for job in jobs:
        print(
            f"Job ID: {job['id']} | "
            f"Title: {job['title']} | "
            f"Company: {job.get('company_name', 'Unknown')}"
        )

    # 3. SUBMIT APPLICATION
    print("\n========== SUBMIT APPLICATION ==========")

    print("Selected Job ID:", TEST_JOB_ID)

    apply_response = requests.post(
        f"{BASE_URL}/api/applications/",
        headers=headers,
        json={"job_id": TEST_JOB_ID},
        timeout=15
    )

    print("Application Status:", apply_response.status_code)

    application_id = None

    if apply_response.status_code == 201:
        result = apply_response.json()
        application = result["application"]

        application_id = application["id"]

        print("Message:", result["message"])
        print("Application ID:", application_id)
        print("Applied Job ID:", application["job_id"])
        print("Job Title:", application["job"]["title"])
        print("Company:", application["job"]["company_name"])
        print("Status:", application["status"])
        print("Resume Match:", application["match_score"])

    elif apply_response.status_code == 409:
        result = apply_response.json()

        print("Duplicate application:", result["message"])

        application_id = result.get("application_id")

    else:
        print("Application failed:")
        print_response_error(apply_response)

        raise SystemExit

    # 4. TEST DUPLICATE APPLICATION PROTECTION
    print("\n========== DUPLICATE APPLICATION TEST ==========")

    duplicate_response = requests.post(
        f"{BASE_URL}/api/applications/",
        headers=headers,
        json={"job_id": TEST_JOB_ID},
        timeout=15
    )

    print("Duplicate Test Status:", duplicate_response.status_code)

    if duplicate_response.status_code == 409:
        print("SUCCESS: Duplicate application prevented.")
    else:
        print("Unexpected response:")
        print_response_error(duplicate_response)

    # 5. FETCH APPLICATION HISTORY
    print("\n========== APPLICATION HISTORY ==========")

    history_response = requests.get(
        f"{BASE_URL}/api/applications/",
        headers=headers,
        timeout=15
    )

    print("History API Status:", history_response.status_code)

    if history_response.status_code != 200:
        print_response_error(history_response)
        raise SystemExit("Unable to retrieve application history.")

    history = history_response.json()
    applications = history.get("applications", [])

    print("Total Applications:", history.get("count", 0))

    applied_job_ids = set()

    for item in applications:
        job_id = int(item["job_id"])
        applied_job_ids.add(job_id)

        print("\nApplication ID:", item["id"])
        print("Job ID:", job_id)
        print("Job:", item["job"]["title"])
        print("Company:", item["job"]["company_name"])
        print("Status:", item["status"])
        print("Match Score:", item["match_score"])

    # 6. VERIFY JOB-TO-APPLICATION MAPPING
    print("\n========== APPLICATION MAPPING VERIFICATION ==========")

    print("Applied Job IDs:", sorted(applied_job_ids))

    print(
        "Junior Data Analyst (Job ID 1):",
        "Already Applied" if 1 in applied_job_ids else "Not Applied"
    )

    print(
        "Business Analyst (Job ID 2):",
        "Already Applied" if 2 in applied_job_ids else "Not Applied"
    )

    print(
        "AI/ML Intern (Job ID 3):",
        "Already Applied" if 3 in applied_job_ids else "Not Applied"
    )

    # 7. FETCH INDIVIDUAL APPLICATION DETAILS
    print("\n========== APPLICATION DETAILS ==========")

    if application_id:
        details_response = requests.get(
            f"{BASE_URL}/api/applications/{application_id}",
            headers=headers,
            timeout=15
        )

        print("Details API Status:", details_response.status_code)

        if details_response.status_code == 200:
            details = details_response.json()["application"]

            print("Application ID:", details["id"])
            print("Job ID:", details["job_id"])
            print("Job:", details["job"]["title"])
            print("Company:", details["job"]["company_name"])
            print("Status:", details["status"])
            print("Match Score:", details["match_score"])
            print("Applied At:", details["applied_at"])
        else:
            print_response_error(details_response)

    print("\n===== APPLICATION API TEST COMPLETED =====")

except requests.exceptions.ConnectionError:
    print("\nERROR: Flask backend is not running.")

except requests.exceptions.Timeout:
    print("\nERROR: Backend request timed out.")

except requests.exceptions.RequestException as error:
    print("\nREQUEST ERROR:", error)

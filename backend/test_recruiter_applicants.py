
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

print("\n===== Recruiter Applicant Management Test =====")

email = input("Recruiter email: ").strip()
password = getpass("Recruiter password: ")

# Recruiter login
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": email, "password": password},
    timeout=15
)

print("\nLogin Status:", login_response.status_code)

if login_response.status_code != 200:
    print(login_response.json())
    raise SystemExit("Recruiter login failed.")

login_data = login_response.json()

if login_data["user"]["role"] != "recruiter":
    raise SystemExit("This account is not a recruiter.")

headers = {
    "Authorization": f"Bearer {login_data['access_token']}"
}

print("Recruiter login successful!")

# Get applicants belonging to recruiter's company
response = requests.get(
    f"{BASE_URL}/api/applications/recruiter",
    headers=headers,
    timeout=15
)

print("\nApplicant API Status:", response.status_code)

result = response.json()
print("\nAPI Response:")
print(result)

if response.status_code != 200:
    raise SystemExit("Unable to retrieve recruiter applicants.")

print("\n===== APPLICANT SUMMARY =====")
print("Company:", result["company"]["name"])
print("Total Applicants:", result["count"])

for application in result["applications"]:
    student = application.get("student", {})
    job = application.get("job", {})

    print("\nApplication ID:", application["id"])
    print("Job:", job.get("title"))
    print("Applicant:", student.get("name"))
    print("Branch:", student.get("branch"))
    print("CGPA:", student.get("cgpa"))
    print("Skills:", student.get("skills"))
    print("Resume Match:", application.get("match_score"))
    print("Status:", application.get("status"))

print("\nRecruiter applicant test completed!")

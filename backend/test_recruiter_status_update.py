
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"
APPLICATION_ID = 3

print("\n===== Recruiter Status Update Test =====")

email = input("Recruiter email: ").strip()
password = getpass("Recruiter password: ")

# 1. Login
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "email": email,
        "password": password
    },
    timeout=15
)

if login_response.status_code != 200:
    print("Login failed:", login_response.json())
    raise SystemExit()

login_data = login_response.json()

if login_data["user"]["role"] != "recruiter":
    raise SystemExit("Only a recruiter can run this test.")

headers = {
    "Authorization": f"Bearer {login_data['access_token']}"
}

print("\nRecruiter login successful.")

# 2. Update application status
update_response = requests.patch(
    f"{BASE_URL}/api/applications/{APPLICATION_ID}/status",
    headers=headers,
    json={"status": "shortlisted"},
    timeout=15
)

print("\nUpdate Status Code:", update_response.status_code)
print("Response:", update_response.json())

if update_response.status_code != 200:
    raise SystemExit("Status update failed.")

updated_application = update_response.json()["application"]

print("\n===== UPDATED APPLICATION =====")
print("Application ID:", updated_application["id"])
print("Job:", updated_application["job"]["title"])
print("Applicant:", updated_application["student"]["name"])
print("New Status:", updated_application["status"])

# 3. Verify recruiter can retrieve the updated status
verify_response = requests.get(
    f"{BASE_URL}/api/applications/recruiter",
    headers=headers,
    timeout=15
)

if verify_response.status_code != 200:
    raise SystemExit("Unable to verify updated application.")

applications = verify_response.json()["applications"]

verified = next(
    (
        application for application in applications
        if application["id"] == APPLICATION_ID
    ),
    None
)

if not verified:
    raise SystemExit("Application not found in recruiter history.")

print("\nVerified status:", verified["status"])

if verified["status"] == "shortlisted":
    print("\nSUCCESS: Application has been shortlisted!")
else:
    raise SystemExit("Status verification failed.")

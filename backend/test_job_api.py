
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

print("\n===== PLACEMATE AI JOB API TEST =====")

email = input("Enter your registered email: ")
password = getpass("Enter your password: ")

# Step 1: Login
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "email": email,
        "password": password
    }
)

print("\nLogin Status:", login_response.status_code)

if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    raise SystemExit

token = login_response.json().get("access_token")

if not token:
    print("Access token not found in login response.")
    print(login_response.text)
    raise SystemExit

headers = {
    "Authorization": f"Bearer {token}"
}

# Step 2: Fetch active jobs
jobs_response = requests.get(
    f"{BASE_URL}/api/jobs/",
    headers=headers
)

print("\nJob API Status:", jobs_response.status_code)

try:
    data = jobs_response.json()
    print("\n===== JOB API RESPONSE =====")
    print(data)

    if jobs_response.status_code == 200:
        print("\nTotal Jobs Found:", data.get("count", 0))

        for job in data.get("jobs", []):
            print("\nJob:", job["title"])
            print("Job ID:", job["id"])
            print("Eligibility:", job["eligibility"]["status"])
            print("Reasons:", job["eligibility"]["reasons"])

except ValueError:
    print("Invalid JSON response:", jobs_response.text)

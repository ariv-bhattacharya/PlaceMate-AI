
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

email = input("Registered email: ")
password = getpass("Password: ")

login = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": email, "password": password}
)

if login.status_code != 200:
    print("Login failed:", login.text)
    raise SystemExit

token = login.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}"
}

job_id = 1

response = requests.get(
    f"{BASE_URL}/api/jobs/{job_id}",
    headers=headers
)

print("\n===== JOB DETAILS API TEST =====")
print("Status Code:", response.status_code)

if response.status_code == 200:
    job = response.json()["job"]

    print("Job:", job["title"])
    print("Eligibility:", job["eligibility"]["status"])

    match = job["resume_match"]

    if match["available"]:
        print("Resume Match:", match["match_score"], "%")
        print("Matched Skills:", match["matched_skills"])
        print("Missing Skills:", match["missing_skills"])
    else:
        print(match["message"])
else:
    print(response.text)

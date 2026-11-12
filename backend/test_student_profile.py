
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

print("\n===== PLACEMATE AI STUDENT PROFILE TEST =====")

# Step 1: Login
email = input("Enter your registered email: ")
password = getpass("Enter your password: ")

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
    print("Access token not found.")
    raise SystemExit

headers = {
    "Authorization": f"Bearer {token}"
}

# Step 2: Collect academic details
print("\n===== ENTER YOUR ACADEMIC DETAILS =====")

branch = input("Branch (e.g. Computer Science and Engineering): ").strip()
graduation_year = int(input("Graduation Year (e.g. 2027): "))
cgpa = float(input("Current CGPA: "))

# Step 3: Prepare profile data
profile_data = {
    "branch": branch,
    "graduation_year": graduation_year,
    "cgpa": cgpa
}

# Step 4: Update student profile
update_response = requests.patch(
    f"{BASE_URL}/api/students/me",
    headers=headers,
    json=profile_data
)

print("\nProfile Update Status:", update_response.status_code)

try:
    update_result = update_response.json()
    print("\n===== PROFILE UPDATE RESPONSE =====")
    print(update_result)
except ValueError:
    print(update_response.text)
    raise SystemExit

if update_response.status_code != 200:
    print("\nProfile update failed.")
    raise SystemExit

# Step 5: Fetch updated profile
profile_response = requests.get(
    f"{BASE_URL}/api/students/me",
    headers=headers
)

print("\nProfile Fetch Status:", profile_response.status_code)

if profile_response.status_code == 200:
    profile = profile_response.json()["profile"]

    print("\n===== SAVED STUDENT PROFILE =====")
    print("Name:", profile["name"])
    print("Branch:", profile["branch"])
    print("Graduation Year:", profile["graduation_year"])
    print("CGPA:", profile["cgpa"])
    print("Total Skills:", len(profile["skills"]))

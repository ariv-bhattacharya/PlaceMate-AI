
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

email = input("Enter your registered email: ")
password = getpass("Enter your password: ")

# Step 1: Login
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "email": email,
        "password": password
    },
    timeout=30
)

print("\nLogin Status:", login_response.status_code)

if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    raise SystemExit

token = login_response.json()["access_token"]
print("Login successful!")

# Step 2: Upload resume
resume_path = r"C:\Users\KIIT\PlaceMate\backend\uploads\resumes\ishita.pdf"

headers = {
    "Authorization": f"Bearer {token}"
}

try:
    with open(resume_path, "rb") as resume_file:
        files = {
            "resume": ("ishita.pdf", resume_file, "application/pdf")
        }

        response = requests.post(
            f"{BASE_URL}/api/resumes/upload",
            headers=headers,
            files=files,
            timeout=60
        )

    print("\nUpload Status:", response.status_code)
    print("Upload Response:", response.text)

except FileNotFoundError:
    print("Resume file not found:", resume_path)

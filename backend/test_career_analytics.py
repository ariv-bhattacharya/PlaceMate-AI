
import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"

print("\n===== PLACEMATE AI CAREER ANALYTICS TEST =====")

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
    print("Access token was not returned.")
    raise SystemExit

headers = {
    "Authorization": f"Bearer {token}"
}

# Step 2: Fetch supported career paths
careers_response = requests.get(
    f"{BASE_URL}/api/analytics/careers",
    headers=headers
)

print("Careers API Status:", careers_response.status_code)

if careers_response.status_code != 200:
    print("Unable to fetch careers:", careers_response.text)
    raise SystemExit

careers = careers_response.json().get("careers", [])

print("\nTotal Career Paths:", len(careers))
print("\nSupported Careers:")

for career in careers:
    print("-", career)

# Step 3: Analyze skills against every career
print("\n========== CAREER SKILL GAP RESULTS ==========")

results = []

for career in careers:
    response = requests.post(
        f"{BASE_URL}/api/analytics/skill-gap",
        headers=headers,
        json={"career": career}
    )

    if response.status_code != 200:
        print(f"\n{career}: Analysis failed")
        print(response.text)
        continue

    data = response.json()
    analysis = data.get("analysis", {})

    result = {
        "career": career,
        "completion": analysis.get("completion_percentage", 0),
        "matched": analysis.get("matched_skills", []),
        "missing": analysis.get("missing_skills", []),
        "optional_matched": analysis.get(
            "matched_optional_skills", []
        ),
        "recommendations": analysis.get(
            "learning_recommendations", []
        )
    }

    results.append(result)

    print(f"\nCAREER: {career}")
    print("Career Readiness:", result["completion"], "%")
    print("Matched Skills:", result["matched"])
    print("Missing Skills:", result["missing"])
    print("Optional Skills Matched:", result["optional_matched"])
    print("Learning Recommendations:", result["recommendations"])

# Step 4: Display career ranking
print("\n========== CAREER READINESS RANKING ==========")

results.sort(
    key=lambda item: item["completion"],
    reverse=True
)

for index, result in enumerate(results, start=1):
    print(
        f"{index}. {result['career']} - "
        f"{result['completion']}%"
    )

print("\n===== CAREER ANALYTICS TEST COMPLETED =====")

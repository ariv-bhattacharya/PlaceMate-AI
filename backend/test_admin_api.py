
import json
import urllib.request
import urllib.error
from getpass import getpass

BASE_URL = "http://127.0.0.1:5000"


def api_request(url, method="GET", data=None, token=None):
    headers = {"Accept": "application/json"}

    if data is not None:
        headers["Content-Type"] = "application/json"

    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data is not None else None

    req = urllib.request.Request(
        url,
        data=body,
        headers=headers,
        method=method
    )

    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())

    except urllib.error.HTTPError as error:
        response_body = error.read().decode()
        try:
            result = json.loads(response_body)
        except json.JSONDecodeError:
            result = {"message": response_body}

        return error.code, result


def main():
    print("\n======= PlaceMate AI Admin API Test =======\n")

    email = input("Enter admin email: ").strip()
    password = getpass("Enter admin password: ")

    # 1. Test login
    status, result = api_request(
        f"{BASE_URL}/api/auth/login",
        method="POST",
        data={
            "email": email,
            "password": password
        }
    )

    print("\n1. ADMIN LOGIN")

    if status != 200:
        print("Login failed:", result)
        return

    user = result.get("user", {})
    token = result.get("access_token")

    if user.get("role") != "admin" or not token:
        print("Login succeeded, but this account is not an admin.")
        return

    print("SUCCESS: Admin login verified.")
    print("Role:", user["role"])

    # 2. Test protected dashboard
    status, result = api_request(
        f"{BASE_URL}/api/admin/dashboard",
        token=token
    )

    print("\n2. ADMIN DASHBOARD API")

    if status != 200:
        print("Dashboard request failed:", result)
        return

    print("SUCCESS: Admin access verified.")

    print("\nPlatform Statistics:")
    for key, value in result.get("statistics", {}).items():
        print(f"{key}: {value}")

    print("\nApplication Statuses:")
    print(result.get("application_statuses", {}))

    print("\nRecruitment Round Statuses:")
    print(result.get("recruitment_round_statuses", {}))

    print("\nAll Admin API checks passed!")


if __name__ == "__main__":
    main()

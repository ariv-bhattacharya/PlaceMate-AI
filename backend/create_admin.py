
from getpass import getpass

from email_validator import validate_email, EmailNotValidError
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User


def main():
    app = create_app()

    with app.app_context():
        print("\n========== PlaceMate AI Admin Setup ==========\n")

        name = input("Enter admin name: ").strip()
        email = input("Enter admin email: ").strip().lower()

        if not name or len(name) > 120:
            print("Error: Name is required and must be 120 characters or fewer.")
            return

        try:
            validated_email = validate_email(
                email,
                check_deliverability=False
            )
            email = validated_email.normalized.lower()

        except EmailNotValidError:
            print("Error: Please enter a valid email address.")
            return

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            print(
                "Error: This email already belongs to an account. "
                "Choose a different email."
            )
            return

        password = getpass("Enter admin password (minimum 12 characters): ")
        confirm_password = getpass("Confirm admin password: ")

        if len(password) < 12:
            print("Error: Admin password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Error: Passwords do not match.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="admin",
            is_active=True
        )

        try:
            db.session.add(admin)
            db.session.commit()

            print("\nAdmin account created successfully!")
            print("Admin ID:", admin.id)
            print("Admin Name:", admin.name)
            print("Admin Email:", admin.email)
            print("Admin Role:", admin.role)
            print("\nKeep your admin password private.")

        except Exception as error:
            db.session.rollback()
            print("Unable to create admin account:", error)


if __name__ == "__main__":
    main()

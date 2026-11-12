from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("SELECT 1"))
        print("SUCCESS: Flask connected to PostgreSQL!")

        result = db.session.execute(
            text("SELECT current_database()")
        )
        print("Connected database:", result.scalar())

    except Exception as e:
        print("DATABASE CONNECTION FAILED:", e)
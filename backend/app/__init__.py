
from flask import Flask
from app.extensions import db, jwt, migrate, cors
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5173"]}}
    )

    from app.models import (
        User, Student, Company, Job,
        Application, Resume, RecruitmentRound
    )

    from app.routes import register_routes
    register_routes(app)

    return app

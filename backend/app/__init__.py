
from flask import Flask

from app.extensions import db, jwt, migrate, cors
from app.config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173"]
            }
        }
    )

    # Import all models so SQLAlchemy and Flask-Migrate
    # can detect the database tables and relationships.
    from app.models import (
        User,
        Student,
        Company,
        Job,
        Application,
        Resume,
        RecruitmentRound,
        CareerRoadmap,
        RoadmapTask,
        RoadmapProgress
    )

    # Register application routes
    from app.routes import register_routes
    register_routes(app)

    return app

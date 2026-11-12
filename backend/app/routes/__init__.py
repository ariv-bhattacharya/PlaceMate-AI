
from flask import Blueprint, jsonify

# ==================================================
# IMPORT ROUTE BLUEPRINTS
# ==================================================

from app.routes.auth_routes import auth_bp
from app.routes.resume_routes import resume_bp
from app.routes.job_routes import job_bp
from app.routes.student_routes import student_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.application_routes import application_bp
from app.routes.recruiter_routes import recruiter_bp
from app.routes.admin_routes import admin_bp


# ==================================================
# HEALTH CHECK
# ==================================================

health_bp = Blueprint("health", __name__)


@health_bp.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "PlaceMate AI backend is running!"
    }), 200


# ==================================================
# REGISTER ALL BLUEPRINTS
# ==================================================

def register_routes(app):

    # Health check
    app.register_blueprint(health_bp)

    # Authentication
    app.register_blueprint(auth_bp)

    # Student features
    app.register_blueprint(student_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(job_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(application_bp)

    # Recruiter features
    app.register_blueprint(recruiter_bp)

    # Admin features
    app.register_blueprint(admin_bp)

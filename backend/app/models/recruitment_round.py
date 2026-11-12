from datetime import datetime
from app.extensions import db


class RecruitmentRound(db.Model):
    __tablename__ = "recruitment_rounds"

    id = db.Column(db.Integer, primary_key=True)

    application_id = db.Column(
        db.Integer,
        db.ForeignKey("applications.id"),
        nullable=False
    )

    round_number = db.Column(db.Integer, nullable=False)
    round_name = db.Column(db.String(100), nullable=False)

    # Examples: pending, scheduled, cleared, rejected
    status = db.Column(db.String(30), default="pending", nullable=False)

    scheduled_at = db.Column(db.DateTime)
    feedback = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            "application_id",
            "round_number",
            name="unique_application_round"
        ),
    )

    application = db.relationship(
        "Application",
        back_populates="recruitment_rounds"
    )

    def __repr__(self):
        return f"<RecruitmentRound {self.round_name}>"
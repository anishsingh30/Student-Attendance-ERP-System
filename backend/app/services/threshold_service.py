from sqlalchemy.orm import Session
from app.models.threshold import AttendanceThreshold
from app.core.config import settings

def get_active_threshold(db: Session) -> AttendanceThreshold:
    """
    Fetch current active threshold config from database, or initialize default.
    """
    threshold = db.query(AttendanceThreshold).filter(AttendanceThreshold.is_active == True).first()
    if not threshold:
        threshold = AttendanceThreshold(
            green_min=settings.DEFAULT_THRESHOLD_GREEN,
            yellow_min=settings.DEFAULT_THRESHOLD_YELLOW,
            orange_min=settings.DEFAULT_THRESHOLD_ORANGE,
            red_max=settings.DEFAULT_THRESHOLD_ORANGE,
            is_active=True
        )
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
    return threshold

def determine_risk_level(percentage: float, threshold: AttendanceThreshold) -> str:
    """
    Deterministic risk classification:
      - GREEN:  >= green_min (default 80%)
      - YELLOW: >= yellow_min and < green_min (default 75% - 79.99%)
      - ORANGE: >= orange_min and < yellow_min (default 65% - 74.99%)
      - RED:    < orange_min (default < 65%)
    """
    if percentage >= threshold.green_min:
        return "GREEN"
    elif percentage >= threshold.yellow_min:
        return "YELLOW"
    elif percentage >= threshold.orange_min:
        return "ORANGE"
    else:
        return "RED"

def get_risk_badge_label(risk_level: str) -> str:
    labels = {
        "GREEN": "Safe (Above Threshold)",
        "YELLOW": "Warning (Approaching Threshold)",
        "ORANGE": "Attendance Shortage",
        "RED": "Critical Shortage"
    }
    return labels.get(risk_level, "Unknown")

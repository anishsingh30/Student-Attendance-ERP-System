import json
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting
from app.models.threshold import AttendanceThreshold
from app.services.audit_service import log_system_action

logger = logging.getLogger("attendance.policy")

DEFAULT_INSTITUTION_POLICY = {
    "statutory_minimum_percentage": 75.0,
    "warning_threshold_percentage": 80.0,
    "critical_threshold_percentage": 65.0,
    "consecutive_absence_trigger_streak": 3,
    "alert_cooldown_hours": 24,
    "auto_resolve_on_recovery": True,
    "auto_escalate_critical_alerts": True,
    "notifications_enabled": True,
    "smtp_email_dispatch_enabled": True,
    "quiet_hours_enabled": False,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00"
}

def get_institution_policy(db: Session) -> Dict[str, Any]:
    """
    Retrieves dynamic, database-backed university policy configuration.
    Falls back to institutional defaults if unconfigured.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == "INSTITUTION_POLICY").first()
    if not setting or not setting.value:
        return DEFAULT_INSTITUTION_POLICY.copy()

    try:
        data = json.loads(setting.value)
        policy = DEFAULT_INSTITUTION_POLICY.copy()
        policy.update(data)
        return policy
    except Exception as e:
        logger.error(f"Failed to parse institution policy: {e}")
        return DEFAULT_INSTITUTION_POLICY.copy()

def update_institution_policy(db: Session, updates: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """
    Updates university attendance policy, validates bounds, synchronizes with threshold records,
    and logs an auditable administrative event.
    """
    current_policy = get_institution_policy(db)
    
    # Validation
    statutory = updates.get("statutory_minimum_percentage", current_policy["statutory_minimum_percentage"])
    warning = updates.get("warning_threshold_percentage", current_policy["warning_threshold_percentage"])
    critical = updates.get("critical_threshold_percentage", current_policy["critical_threshold_percentage"])

    if not (0 <= critical < statutory <= warning <= 100):
        raise ValueError("Invalid threshold ordering: must satisfy 0 <= critical < statutory <= warning <= 100")

    current_policy.update(updates)

    # Persist in system_settings
    setting = db.query(SystemSetting).filter(SystemSetting.key == "INSTITUTION_POLICY").first()
    if not setting:
        setting = SystemSetting(
            key="INSTITUTION_POLICY",
            value=json.dumps(current_policy, indent=2),
            description="University-wide attendance thresholds, alert cooldowns, and intervention rules."
        )
        db.add(setting)
    else:
        setting.value = json.dumps(current_policy, indent=2)

    # Sync with active AttendanceThreshold record
    active_thresh = db.query(AttendanceThreshold).filter(AttendanceThreshold.is_active == True).first()
    if active_thresh:
        active_thresh.yellow_min = statutory
        active_thresh.green_min = warning
        active_thresh.orange_min = critical
        active_thresh.red_min = 0.0

    db.commit()

    log_system_action(
        db=db,
        action="POLICY_UPDATED",
        resource="INSTITUTION_POLICY",
        status="SUCCESS",
        user_id=user_id,
        details=f"Updated university policy settings: statutory={statutory}%, warning={warning}%, critical={critical}%"
    )

    return current_policy

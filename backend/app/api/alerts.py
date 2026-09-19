from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert, AlertIntervention
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import FacultySubject
from app.schemas.alert import (
    AlertResponse,
    AlertResolveRequest,
    AlertInterventionCreate,
    AlertInterventionResponse,
    AlertActionRequest
)
from app.services.audit_service import log_system_action

router = APIRouter(prefix="/alerts", tags=["Alerts"])

def _format_alert_response(a: Alert) -> AlertResponse:
    interventions_list = []
    for inv in a.interventions:
        interventions_list.append(AlertInterventionResponse(
            id=inv.id,
            alert_id=inv.alert_id,
            action_type=inv.action_type,
            previous_status=inv.previous_status,
            new_status=inv.new_status,
            notes=inv.notes,
            attendance_before=inv.attendance_before,
            attendance_after=inv.attendance_after,
            outcome_status=inv.outcome_status or "PENDING",
            performed_by_user_id=inv.performed_by_user_id,
            performed_by_name=inv.performed_by.full_name if inv.performed_by else None,
            created_at=inv.created_at
        ))

    return AlertResponse(
        id=a.id,
        student_id=a.student_id,
        student_name=a.student.user.full_name if a.student and a.student.user else None,
        roll_number=a.student.roll_number if a.student else None,
        subject_id=a.subject_id,
        subject_name=a.subject.name if a.subject else None,
        subject_code=a.subject.code if a.subject else None,
        risk_level=a.risk_level,
        current_percentage=a.current_percentage,
        required_percentage=a.required_percentage,
        classes_attended=a.classes_attended,
        classes_conducted=a.classes_conducted,
        classes_required=a.classes_required,
        title=a.title,
        explanation=a.explanation,
        recommended_action=a.recommended_action,
        lifecycle_status=a.lifecycle_status or ("RESOLVED" if a.is_resolved else "NEW"),
        is_resolved=a.is_resolved,
        assigned_to_user_id=a.assigned_to_user_id,
        resolved_at=a.resolved_at,
        resolved_by_user_id=a.resolved_by_user_id,
        dismiss_reason=a.dismiss_reason,
        created_at=a.created_at,
        interventions=interventions_list
    )

def _check_alert_access(alert: Alert, current_user: User, db: Session):
    if current_user.role == "admin":
        return
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or alert.student_id != student.id:
            raise HTTPException(status_code=403, detail="Access forbidden: cannot access another student's alerts")
    elif current_user.role == "faculty":
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            teaches = db.query(FacultySubject).filter(
                FacultySubject.faculty_id == faculty.id,
                FacultySubject.subject_id == alert.subject_id
            ).first()
            if not teaches:
                raise HTTPException(status_code=403, detail="Access forbidden: faculty does not teach this subject")

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    risk_level: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    lifecycle_status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)

    # Student isolation
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(Alert.student_id == student.id)
    elif current_user.role == "faculty":
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            subject_ids = [fs.subject_id for fs in db.query(FacultySubject).filter(FacultySubject.faculty_id == faculty.id).all()]
            query = query.filter(Alert.subject_id.in_(subject_ids))

    if risk_level:
        query = query.filter(Alert.risk_level == risk_level.upper())
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if lifecycle_status:
        query = query.filter(Alert.lifecycle_status == lifecycle_status.upper())

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return [_format_alert_response(a) for a in alerts]

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)
    return _format_alert_response(alert)

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    req: AlertActionRequest = AlertActionRequest(action_type="ACKNOWLEDGED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty or administrators can acknowledge alerts")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)

    prev_status = alert.lifecycle_status
    alert.lifecycle_status = "ACKNOWLEDGED"
    if req.assigned_to_user_id:
        alert.assigned_to_user_id = req.assigned_to_user_id
    else:
        alert.assigned_to_user_id = current_user.id

    inv = AlertIntervention(
        alert_id=alert.id,
        action_type="ACKNOWLEDGED",
        previous_status=prev_status,
        new_status="ACKNOWLEDGED",
        notes=req.notes or "Alert acknowledged by academic staff.",
        performed_by_user_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(alert)

    log_system_action(db, "ALERT_ACKNOWLEDGED", f"alert_id: {alert.id} by user {current_user.id}", user_id=current_user.id)
    return _format_alert_response(alert)

@router.post("/{alert_id}/intervene", response_model=AlertResponse)
def record_alert_intervention(
    alert_id: int,
    req: AlertInterventionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty or administrators can record interventions")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)

    prev_status = alert.lifecycle_status
    new_status = req.new_status or "IN_PROGRESS"
    alert.lifecycle_status = new_status

    inv = AlertIntervention(
        alert_id=alert.id,
        action_type=req.action_type,
        previous_status=prev_status,
        new_status=new_status,
        notes=req.notes,
        attendance_before=req.attendance_before if req.attendance_before is not None else alert.current_percentage,
        attendance_after=req.attendance_after,
        outcome_status=req.outcome_status or "PENDING",
        performed_by_user_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(alert)

    log_system_action(db, "ALERT_INTERVENTION_RECORDED", f"alert_id: {alert.id}, action: {req.action_type}", user_id=current_user.id)
    return _format_alert_response(alert)

@router.post("/{alert_id}/escalate", response_model=AlertResponse)
def escalate_alert(
    alert_id: int,
    req: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)

    prev_status = alert.lifecycle_status
    alert.lifecycle_status = "ESCALATED"

    inv = AlertIntervention(
        alert_id=alert.id,
        action_type="ESCALATED",
        previous_status=prev_status,
        new_status="ESCALATED",
        notes=req.notes or "Alert escalated for administrative and departmental review.",
        attendance_before=alert.current_percentage,
        outcome_status="PENDING",
        performed_by_user_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(alert)

    log_system_action(db, "ALERT_ESCALATED", f"alert_id: {alert.id}", user_id=current_user.id)
    return _format_alert_response(alert)

@router.post("/{alert_id}/dismiss", response_model=AlertResponse)
def dismiss_alert(
    alert_id: int,
    req: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)

    if not req.dismiss_reason and not req.notes:
        raise HTTPException(status_code=400, detail="A reason must be provided to dismiss an active alert")

    prev_status = alert.lifecycle_status
    alert.lifecycle_status = "DISMISSED"
    alert.is_resolved = True
    alert.dismiss_reason = req.dismiss_reason or req.notes
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by_user_id = current_user.id

    inv = AlertIntervention(
        alert_id=alert.id,
        action_type="DISMISSED",
        previous_status=prev_status,
        new_status="DISMISSED",
        notes=alert.dismiss_reason,
        attendance_before=alert.current_percentage,
        outcome_status="STABLE",
        performed_by_user_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(alert)

    log_system_action(db, "ALERT_DISMISSED", f"alert_id: {alert.id}, reason: {alert.dismiss_reason}", user_id=current_user.id)
    return _format_alert_response(alert)

@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    _check_alert_access(alert, current_user, db)

    # --- Idempotency: already in the target state ---
    if req.is_resolved and alert.is_resolved:
        # Already resolved — return current state without side-effects
        return _format_alert_response(alert)
    if not req.is_resolved and not alert.is_resolved:
        # Already unresolved/open — return current state without side-effects
        return _format_alert_response(alert)

    # --- Unique constraint guard for REOPEN ---
    # The alerts table has a partial unique index on (student_id, subject_id)
    # WHERE is_resolved = 0 (false).  If the agent already created a new active
    # alert for the same student+subject after this one was resolved, we cannot
    # reopen this old alert because it would violate the constraint.
    if not req.is_resolved:
        conflict = (
            db.query(Alert)
            .filter(
                Alert.student_id == alert.student_id,
                Alert.subject_id == alert.subject_id,
                Alert.is_resolved == False,
                Alert.id != alert.id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=(
                    "A newer active alert already exists for this subject. "
                    "This resolved alert cannot be reopened because the attendance "
                    "monitoring agent has already created an updated alert for the "
                    "same course. Review the newer alert instead."
                ),
            )

    prev_status = alert.lifecycle_status
    alert.is_resolved = req.is_resolved
    if req.is_resolved:
        alert.lifecycle_status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by_user_id = current_user.id
    else:
        alert.lifecycle_status = "NEW"
        alert.resolved_at = None
        alert.resolved_by_user_id = None

    inv = AlertIntervention(
        alert_id=alert.id,
        action_type="RESOLVED" if req.is_resolved else "REOPENED",
        previous_status=prev_status,
        new_status=alert.lifecycle_status,
        notes=req.notes or ("Alert resolved and student attendance recovered." if req.is_resolved else "Alert reopened for continued monitoring."),
        attendance_before=alert.current_percentage,
        attendance_after=alert.current_percentage,
        outcome_status="IMPROVED" if req.is_resolved else "PENDING",
        performed_by_user_id=current_user.id
    )
    db.add(inv)
    db.commit()
    db.refresh(alert)

    log_system_action(db, "ALERT_STATUS_UPDATED", f"alert_id: {alert.id}, resolved: {req.is_resolved}, by user: {current_user.id}", user_id=current_user.id)
    return _format_alert_response(alert)

@router.get("/{alert_id}/interventions", response_model=List[AlertInterventionResponse])
def get_alert_interventions(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _check_alert_access(alert, current_user, db)

    interventions = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert_id).order_by(AlertIntervention.created_at.desc()).all()
    results = []
    for inv in interventions:
        results.append(AlertInterventionResponse(
            id=inv.id,
            alert_id=inv.alert_id,
            action_type=inv.action_type,
            previous_status=inv.previous_status,
            new_status=inv.new_status,
            notes=inv.notes,
            attendance_before=inv.attendance_before,
            attendance_after=inv.attendance_after,
            outcome_status=inv.outcome_status or "PENDING",
            performed_by_user_id=inv.performed_by_user_id,
            performed_by_name=inv.performed_by.full_name if inv.performed_by else None,
            created_at=inv.created_at
        ))
    return results

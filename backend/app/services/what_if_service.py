from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.subject import Subject
from app.services.attendance_service import get_student_subject_attendance
from app.services.recovery_calculator import calculate_percentage
from app.services.threshold_service import get_active_threshold, determine_risk_level
from app.schemas.attendance import WhatIfResponse

def simulate_attendance_scenario(
    db: Session,
    student_id: int,
    subject_id: int,
    classes_to_attend: int,
    classes_to_miss: int
) -> WhatIfResponse:
    """
    1. Deterministic Math Calculation first.
    2. Then generate natural-language synthesis based on exact computed facts.
    """
    current_data = get_student_subject_attendance(db, student_id, subject_id)
    threshold = get_active_threshold(db)

    c_att = current_data["classes_attended"]
    c_cond = current_data["classes_conducted"]
    c_pct = current_data["percentage"]
    c_risk = current_data["risk_level"]

    # Deterministic simulation
    new_att = c_att + max(0, classes_to_attend)
    new_cond = c_cond + max(0, classes_to_attend) + max(0, classes_to_miss)
    proj_pct = calculate_percentage(new_att, new_cond)
    proj_risk = determine_risk_level(proj_pct, threshold)
    pct_change = round(proj_pct - c_pct, 2)
    is_above = proj_pct >= threshold.yellow_min

    student = db.query(Student).filter(Student.id == student_id).first()
    student_name = student.user.full_name if student and student.user else "Student"
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    subject_name = subject.name if subject else "Course"
    subject_code = subject.code if subject else "SUB"

    # Status summary
    if is_above:
        if pct_change < 0:
            status_summary = f"Projected attendance drops by {abs(pct_change)}% to {proj_pct}%, but remains safely above the {threshold.yellow_min}% threshold."
        elif pct_change > 0:
            status_summary = f"Projected attendance increases by +{pct_change}% to {proj_pct}%, safely above the {threshold.yellow_min}% threshold."
        else:
            status_summary = f"Attendance remains steady at {proj_pct}%, above the {threshold.yellow_min}% threshold."
    else:
        deficit = round(threshold.yellow_min - proj_pct, 2)
        status_summary = f"Attendance drops below the required {threshold.yellow_min}% threshold to {proj_pct}% ({deficit}% deficit). Immediate recovery needed."

    # Personalized natural-language explanation based strictly on deterministic numbers
    explanation_parts = []
    if classes_to_miss > 0 and classes_to_attend == 0:
        if is_above:
            explanation_parts.append(
                f"If you miss the next {classes_to_miss} class{'es' if classes_to_miss > 1 else ''} of {subject_name}, "
                f"your attendance will decline from {c_pct}% to {proj_pct}%. "
                f"Fortunately, you will still meet the mandatory {threshold.yellow_min}% requirement with a {round(proj_pct - threshold.yellow_min, 2)}% buffer."
            )
        else:
            explanation_parts.append(
                f"Warning: Missing the next {classes_to_miss} class{'es' if classes_to_miss > 1 else ''} of {subject_name} "
                f"would reduce your attendance to {proj_pct}%, pushing you into {proj_risk} status below the {threshold.yellow_min}% institutional threshold. "
                f"To restore compliance afterwards, you would need to attend consecutive upcoming sessions without absence."
            )
    elif classes_to_attend > 0 and classes_to_miss == 0:
        if c_pct < threshold.yellow_min and proj_pct >= threshold.yellow_min:
            explanation_parts.append(
                f"Great progress! Attending the next {classes_to_attend} consecutive session{'s' if classes_to_attend > 1 else ''} "
                f"will elevate your attendance in {subject_name} from {c_pct}% to {proj_pct}%, successfully recovering above the {threshold.yellow_min}% requirement!"
            )
        else:
            explanation_parts.append(
                f"By attending the next {classes_to_attend} session{'s' if classes_to_attend > 1 else ''}, your attendance in {subject_name} "
                f"will improve from {c_pct}% to {proj_pct}% (+{pct_change}%). "
            )
            if not is_above:
                explanation_parts.append(
                    f"You will still be {round(threshold.yellow_min - proj_pct, 2)}% below the {threshold.yellow_min}% threshold, so continue regular attendance."
                )
    else:
        explanation_parts.append(
            f"Under this scenario (+{classes_to_attend} attended, +{classes_to_miss} missed), your projected attendance in {subject_name} "
            f"is {proj_pct}% ({'+' if pct_change >= 0 else ''}{pct_change}% change)."
        )

    ai_explanation = " ".join(explanation_parts)

    return WhatIfResponse(
        student_id=student_id,
        student_name=student_name,
        subject_id=subject_id,
        subject_code=subject_code,
        subject_name=subject_name,
        current_attended=c_att,
        current_conducted=c_cond,
        current_percentage=c_pct,
        current_risk_level=c_risk,
        simulated_classes_attended=new_att,
        simulated_classes_conducted=new_cond,
        projected_percentage=proj_pct,
        projected_risk_level=proj_risk,
        percentage_change=pct_change,
        required_threshold=threshold.yellow_min,
        is_above_threshold=is_above,
        status_summary=status_summary,
        ai_explanation=ai_explanation
    )

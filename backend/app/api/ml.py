from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.ml.predictor import ml_predictor
from app.ml.train import train_and_evaluate_model

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/metrics")
def get_ml_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real machine learning model evaluation metrics:
    Accuracy, Precision, Recall, F1 Score, Confusion Matrix, and Feature Importances.
    """
    return ml_predictor.get_metrics(db)

@router.post("/predict/{student_id}")
def predict_student_risk(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a predictive machine learning attendance risk forecast for a student.
    Enforces RBAC: Students can only query their own ID; Faculty can query their students; Admins can query any.
    """
    if current_user.role == "student":
        st = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not st or st.id != student_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only query your own predictive trajectory.")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if subject_id is not None:
        return ml_predictor.predict_student_subject(db, student_id, subject_id)

    # If no subject specified, predict across all enrolled subjects for student
    subs = db.query(Subject).filter(
        Subject.department == student.department,
        Subject.semester == student.semester
    ).all()

    predictions = []
    for sub in subs:
        pred = ml_predictor.predict_student_subject(db, student_id, sub.id)
        predictions.append({
            "subject_id": sub.id,
            "subject_code": sub.code,
            "subject_name": sub.name,
            **pred
        })

    return {
        "student_id": student_id,
        "roll_number": student.roll_number,
        "predictions": predictions
    }

@router.post("/train")
def retrain_ml_model(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Retrains the Random Forest risk prediction model on active attendance records
    and recalculates test metrics and confusion matrix.
    """
    try:
        metrics = train_and_evaluate_model(db, created_by_user_id=current_user.id)
        ml_predictor.reload(db)
        return {"status": "SUCCESS", "message": "ML model successfully retrained and evaluated.", "results": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")

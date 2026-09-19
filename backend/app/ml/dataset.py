from datetime import datetime, date, timezone
from typing import List, Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance

FEATURE_NAMES = [
    "overall_percentage",
    "recent_5_rate",
    "consecutive_absences",
    "sessions_conducted",
    "classes_remaining",
    "days_since_last_presence"
]

RISK_TIERS = ["SAFE", "WARNING", "SHORTAGE", "CRITICAL"]

def extract_student_subject_features(db: Session, student_id: int, subject_id: int) -> Tuple[List[float], int]:
    """
    Extracts 6 real numerical attendance features and ground truth risk tier for a student-subject pair.
    Features:
    1. overall_percentage: (attended / conducted) * 100
    2. recent_5_rate: attendance rate over the last 5 sessions
    3. consecutive_absences: current streak of consecutive absent marks
    4. sessions_conducted: total number of sessions held so far
    5. classes_remaining: scheduled remaining classes
    6. days_since_last_presence: calendar days elapsed since student last attended
    """
    records = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.subject_id == subject_id
    ).order_by(Attendance.date.asc()).all()

    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    total_scheduled = sub.total_classes_scheduled if sub else 50

    conducted = len(records)
    if conducted == 0:
        return [100.0, 100.0, 0, 0, total_scheduled, 0], 0

    attended = sum(1 for r in records if r.status == "PRESENT")
    overall_pct = (attended / conducted) * 100.0

    # Recent 5 sessions rate
    recent_5 = records[-5:]
    recent_attended = sum(1 for r in recent_5 if r.status == "PRESENT")
    recent_rate = (recent_attended / len(recent_5)) * 100.0

    # Consecutive absences streak at the end
    streak = 0
    for r in reversed(records):
        if r.status == "ABSENT":
            streak += 1
        else:
            break

    # Days since last presence
    last_present = next((r for r in reversed(records) if r.status == "PRESENT"), None)
    if last_present:
        days_since = (date.today() - last_present.date).days
        days_since = max(0, days_since)
    else:
        days_since = 30

    classes_remaining = max(0, total_scheduled - conducted)

    # Label: 0=SAFE (>=80%), 1=WARNING (75-79.9%), 2=SHORTAGE (65-74.9%), 3=CRITICAL (<65%)
    if overall_pct >= 80.0:
        label = 0
    elif overall_pct >= 75.0:
        label = 1
    elif overall_pct >= 65.0:
        label = 2
    else:
        label = 3

    features = [
        round(overall_pct, 2),
        round(recent_rate, 2),
        float(streak),
        float(conducted),
        float(classes_remaining),
        float(days_since)
    ]
    return features, label

def build_raw_dataset_from_db(db: Session) -> Tuple[List[Dict[str, Any]], np.ndarray, np.ndarray, List[int]]:
    """
    Extracts pure un-augmented empirical attendance feature vectors and labels from the database.
    Returns:
    - samples: List of metadata dicts (student_id, subject_id, features, label)
    - X: 2D numpy array of raw feature vectors
    - y: 1D numpy array of raw ground truth labels
    - student_ids: List of student_ids corresponding to each row (enabling group-based splitting)
    """
    students = db.query(Student).all()
    samples = []
    X = []
    y = []
    student_ids = []

    for st in students:
        subs = db.query(Subject).filter(
            Subject.department == st.department,
            Subject.semester == st.semester
        ).all()
        for sub in subs:
            features, label = extract_student_subject_features(db, st.id, sub.id)
            samples.append({
                "student_id": st.id,
                "subject_id": sub.id,
                "features": features,
                "label": label
            })
            X.append(features)
            y.append(label)
            student_ids.append(st.id)

    return samples, np.array(X, dtype=float), np.array(y, dtype=int), student_ids

def augment_training_data_only(X_train: np.ndarray, y_train: np.ndarray, target_multiplier: int = 4) -> Tuple[np.ndarray, np.ndarray]:
    """
    Applies Gaussian feature jitter strictly and exclusively to the TRAINING partition.
    Guarantees that test partition remains 100% untouched empirical data, eliminating data leakage.
    """
    if len(X_train) == 0:
        return X_train, y_train

    augmented_X = list(X_train)
    augmented_y = list(y_train)

    # Feature-specific noise standard deviations:
    # [overall_pct: 1.0, recent_5_rate: 1.5, streak: 0.1, conducted: 0.2, remaining: 0.2, days_since: 0.2]
    noise_std = np.array([1.0, 1.5, 0.1, 0.2, 0.2, 0.2])

    for i in range(len(X_train)):
        for _ in range(target_multiplier):
            noise = np.random.normal(0, noise_std)
            noisy_sample = np.clip(X_train[i] + noise, 0, 100)
            # Ensure integer-like bounds for discrete features
            noisy_sample[2] = max(0.0, round(noisy_sample[2]))  # streak
            noisy_sample[3] = max(1.0, round(noisy_sample[3]))  # conducted
            noisy_sample[4] = max(0.0, round(noisy_sample[4]))  # remaining
            noisy_sample[5] = max(0.0, round(noisy_sample[5]))  # days_since
            augmented_X.append(noisy_sample)
            augmented_y.append(int(y_train[i]))

    return np.array(augmented_X, dtype=float), np.array(augmented_y, dtype=int)


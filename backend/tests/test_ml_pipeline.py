import pytest
from app.core.database import SessionLocal
from app.ml.dataset import build_raw_dataset_from_db, augment_training_data_only, FEATURE_NAMES, extract_student_subject_features
from app.ml.train import train_and_evaluate_model
from app.ml.predictor import ml_predictor
from app.models.student import Student
from app.models.subject import Subject

def test_extract_dataset():
    """Verify feature extraction extracts valid numerical features and classes."""
    db = SessionLocal()
    try:
        assert len(FEATURE_NAMES) == 6
        assert "overall_percentage" in FEATURE_NAMES
        assert "recent_5_rate" in FEATURE_NAMES
        assert "consecutive_absences" in FEATURE_NAMES

        student = db.query(Student).first()
        subject = db.query(Subject).first()
        if student and subject:
            features, label = extract_student_subject_features(db, student.id, subject.id)
            assert len(features) == 6
            assert 0.0 <= features[0] <= 100.0
            assert label in [0, 1, 2, 3]

        samples, X, y, student_ids = build_raw_dataset_from_db(db)
        if len(X) > 0:
            assert len(X) == len(y) == len(student_ids) == len(samples)
            assert len(X[0]) == 6
    finally:
        db.close()

def test_train_and_evaluate_model_leakage_free():
    """Verify real training produces non-fabricated, leakage-free evaluation metrics."""
    db = SessionLocal()
    try:
        metrics = train_and_evaluate_model(db)
        assert metrics["algorithm"] == "RandomForestClassifier"
        assert "model_version" in metrics
        assert metrics.get("leakage_prevention_verified") is True
        assert "split_methodology" in metrics

        ev = metrics["metrics"]
        assert 0.0 <= ev["accuracy"] <= 1.0
        assert 0.0 <= ev["precision"] <= 1.0
        assert 0.0 <= ev["recall"] <= 1.0
        assert 0.0 <= ev["f1_score"] <= 1.0

        cm = metrics["confusion_matrix"]
        assert "labels" in metrics
        assert isinstance(cm, list)
        assert len(cm) == len(metrics["labels"])

        # Check feature importances sum close to 1.0
        fi = metrics["feature_importances"]
        total_imp = sum(fi.values())
        assert abs(total_imp - 1.0) < 0.05
    finally:
        db.close()

def test_ml_predictor_live_inference():
    """Verify live inference returns valid probabilities and predictions for student subject."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).first()
        assert student is not None
        assert subject is not None

        pred = ml_predictor.predict_student_subject(db, student.id, subject.id)

        assert "predicted_risk_tier" in pred
        assert pred["predicted_risk_tier"] in ["SAFE", "WARNING", "SHORTAGE", "CRITICAL"]
        assert "debarment_risk_probability" in pred
        assert "tier_probabilities" in pred
        assert "feature_inputs" in pred
        assert 0.0 <= pred["debarment_risk_probability"] <= 1.0
    finally:
        db.close()


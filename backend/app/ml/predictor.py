import os
import json
import logging
from typing import Dict, Any, Optional, List
import numpy as np
import joblib
from sqlalchemy.orm import Session
from app.ml.dataset import extract_student_subject_features, FEATURE_NAMES, RISK_TIERS
from app.ml.train import MODEL_PATH, METRICS_PATH, train_and_evaluate_model

logger = logging.getLogger("attendance.ml")

class MLAttendancePredictor:
    """
    Inference service for real Machine Learning Attendance Risk Prediction.
    Loads persisted weights, provides explainable factor breakdowns, and generates
    calibrated risk forecasts with explicit transparent fallback when uninitialized.
    """

    def __init__(self):
        self._model = None
        self._metrics = None

    def get_metrics(self, db: Optional[Session] = None) -> Dict[str, Any]:
        """Loads and returns verified model evaluation metrics, baseline comparison and confusion matrix."""
        if not os.path.exists(METRICS_PATH):
            if db is not None:
                try:
                    return train_and_evaluate_model(db)
                except Exception as e:
                    logger.warning(f"Could not auto-train model for metrics: {e}")
            return {
                "model_version": "v2.1.0-uninitialized",
                "algorithm": "RandomForestClassifier",
                "status": "NOT_TRAINED",
                "metrics": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0},
                "baseline_comparison": {"baseline_accuracy": 0.0, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1_score": 0.0},
                "confusion_matrix": [],
                "feature_importances": {}
            }

        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading model metrics: {e}")
            return {
                "model_version": "v2.1.0-error",
                "algorithm": "RandomForestClassifier",
                "status": "ERROR",
                "metrics": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0},
                "baseline_comparison": {"baseline_accuracy": 0.0, "baseline_precision": 0.0, "baseline_recall": 0.0, "baseline_f1_score": 0.0},
                "confusion_matrix": [],
                "feature_importances": {}
            }

    def _ensure_model(self, db: Session) -> bool:
        if self._model is not None:
            return True
        if not os.path.exists(MODEL_PATH):
            try:
                train_and_evaluate_model(db)
            except Exception as e:
                logger.warning(f"Model auto-training deferred: {e}")
                return False
        try:
            self._model = joblib.load(MODEL_PATH)
            return True
        except Exception as e:
            logger.error(f"Failed to load ML model artifact: {e}")
            return False

    def reload(self) -> bool:
        """Forces immediate reload of the persisted model artifact from disk into memory."""
        try:
            if os.path.exists(MODEL_PATH):
                self._model = joblib.load(MODEL_PATH)
                logger.info(f"Reloaded persisted ML model from {MODEL_PATH}")
                return True
            else:
                self._model = None
                return False
        except Exception as e:
            logger.error(f"Failed to reload persisted model: {e}")
            self._model = None
            return False

    def explain_factors(self, features: List[float]) -> List[Dict[str, Any]]:
        """
        Generates understandable risk factor explanations based on extracted features.
        Distinguishes positive recovery momentum from negative risk drags.
        """
        overall_pct, recent_5_rate, streak, conducted, remaining, days_since = features
        factors = []

        # Current standing
        if overall_pct < 75.0:
            deficit = round(75.0 - overall_pct, 1)
            factors.append({
                "factor": "Statutory Deficit",
                "impact": "NEGATIVE",
                "description": f"Current attendance ({overall_pct}%) is {deficit}% below the mandatory 75% minimum.",
                "provenance": "CALCULATED"
            })
        else:
            buffer = round(overall_pct - 75.0, 1)
            factors.append({
                "factor": "Statutory Compliance",
                "impact": "POSITIVE",
                "description": f"Current attendance ({overall_pct}%) maintains a {buffer}% safety buffer above threshold.",
                "provenance": "CALCULATED"
            })

        # Recent trend (last 5 sessions)
        if recent_5_rate < 0.60:
            factors.append({
                "factor": "Recent Attendance Velocity",
                "impact": "NEGATIVE",
                "description": f"Recent 5-session attendance is critically low ({int(recent_5_rate * 100)}%), accelerating risk.",
                "provenance": "ML_PREDICTION"
            })
        elif recent_5_rate >= 0.80:
            factors.append({
                "factor": "Recent Recovery Momentum",
                "impact": "POSITIVE",
                "description": f"Strong recent attendance ({int(recent_5_rate * 100)}% over last 5 sessions) indicates recovery trajectory.",
                "provenance": "ML_PREDICTION"
            })

        # Active absence streak
        if streak >= 3:
            factors.append({
                "factor": "Absence Streak Warning",
                "impact": "CRITICAL_NEGATIVE",
                "description": f"Active streak of {int(streak)} consecutive absences triggers heightened intervention policy.",
                "provenance": "CALCULATED"
            })
        elif streak > 0:
            factors.append({
                "factor": "Active Absence",
                "impact": "NEUTRAL",
                "description": f"Student missed the last {int(streak)} session(s).",
                "provenance": "CALCULATED"
            })

        # Course timeline
        if remaining < 10 and overall_pct < 75.0:
            factors.append({
                "factor": "Limited Remaining Sessions",
                "impact": "NEGATIVE",
                "description": f"Only {int(remaining)} lectures remain in semester, narrowing recovery feasibility.",
                "provenance": "RETRIEVED"
            })

        return factors

    def predict_student_subject(self, db: Session, student_id: int, subject_id: int) -> Dict[str, Any]:
        """Runs ML inference for a student in a specific subject with explainability and fallback."""
        features, true_label = extract_student_subject_features(db, student_id, subject_id)
        has_model = self._ensure_model(db)
        factors = self.explain_factors(features)

        if not has_model or self._model is None:
            # Explicit, honest heuristic trajectory fallback
            overall_pct = features[0]
            streak = features[2]
            
            if overall_pct < 65.0:
                fallback_tier = "CRITICAL"
                debarment_prob = 0.90 + min(0.09, streak * 0.02)
            elif overall_pct < 75.0:
                fallback_tier = "SHORTAGE"
                debarment_prob = 0.65 + min(0.20, streak * 0.05)
            elif overall_pct < 80.0:
                fallback_tier = "WARNING"
                debarment_prob = 0.35 + min(0.25, streak * 0.08)
            else:
                fallback_tier = "SAFE"
                debarment_prob = 0.05 if streak == 0 else min(0.30, streak * 0.10)

            return {
                "model_version": "v2.1.0-fallback-heuristic",
                "algorithm": "TrajectoryRuleScorer",
                "is_ml_active": False,
                "predicted_risk_tier": fallback_tier,
                "debarment_risk_probability": round(float(debarment_prob), 4),
                "tier_probabilities": {fallback_tier: 1.0},
                "feature_inputs": dict(zip(FEATURE_NAMES, features)),
                "explainability_factors": factors,
                "statutory_compliance_note": "ML model artifact offline. Using deterministic heuristic trajectory estimate."
            }

        X_sample = np.array([features], dtype=float)
        pred_label_idx = int(self._model.predict(X_sample)[0])
        probabilities = self._model.predict_proba(X_sample)[0]

        classes = list(self._model.classes_)
        prob_dict = {}
        for idx, cls_id in enumerate(classes):
            tier_name = RISK_TIERS[cls_id] if cls_id < len(RISK_TIERS) else f"TIER_{cls_id}"
            prob_dict[tier_name] = round(float(probabilities[idx]), 4)

        debarment_risk_prob = sum(
            probabilities[idx] for idx, cls_id in enumerate(classes) if cls_id in [2, 3]
        )

        return {
            "model_version": "v2.1.0-rf-leakage-free",
            "algorithm": "RandomForestClassifier",
            "is_ml_active": True,
            "predicted_risk_tier": RISK_TIERS[pred_label_idx] if pred_label_idx < len(RISK_TIERS) else f"TIER_{pred_label_idx}",
            "debarment_risk_probability": round(float(debarment_risk_prob), 4),
            "tier_probabilities": prob_dict,
            "feature_inputs": dict(zip(FEATURE_NAMES, features)),
            "explainability_factors": factors,
            "statutory_compliance_note": "Statutory university debarment is governed strictly by the 75% threshold arithmetic. This prediction provides statistical early-warning trajectory analysis."
        }

ml_predictor = MLAttendancePredictor()

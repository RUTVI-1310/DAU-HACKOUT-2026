"""
Comprehensive Model Evaluation & Accuracy Benchmark
DAU-HACKOUT-2026 — Team EVILCODER
Lead ML: Rutvi Raval

Evaluates the Isolation Forest model on a balanced 1,000-sample test dataset
with simulated normal operations and fault injections.
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import extract_features, calculate_expected_wind_power
from ml.pipeline import IsolationForestAnomalyDetector


def generate_evaluation_dataset(n_normal=850, n_anomalies=150):
    """
    Creates a rigorous test set containing:
    - Normal operating points across full wind speed spectrum (3.0 to 22 m/s)
    - Low wind non-fault edge cases
    - Progressive bearing degradation anomalies
    - Generator thermal runaway anomalies
    - Gearbox harmonic vibration anomalies
    """
    np.random.seed(101)
    records = []
    labels = []  # 0 = Normal, 1 = Anomaly

    # 1. Normal operational records (850 samples)
    for _ in range(n_normal):
        wind = float(np.random.uniform(3.2, 20.0))
        expected_p = calculate_expected_wind_power(wind)
        actual_p = max(0.1, expected_p * float(np.random.normal(0.99, 0.025)))
        vib = float(np.random.normal(3.10, 0.16))
        temp = float(np.random.normal(63.5, 1.2))
        rpm = float(np.random.normal(1500.0, 10.0)) if wind >= 10.0 else float(np.random.normal(1200.0, 25.0))
        curr = float(np.random.normal(28.0, 0.9))

        records.append({
            "wind_speed": wind,
            "power_output": actual_p,
            "temperature": temp,
            "vibration": vib,
            "rpm": rpm,
            "current": curr
        })
        labels.append(0)

    # 2. Injected Anomalies (150 samples)
    # 2a. Bearing degradation (60 samples)
    for _ in range(60):
        wind = float(np.random.uniform(9.0, 16.0))
        expected_p = calculate_expected_wind_power(wind)
        records.append({
            "wind_speed": wind,
            "power_output": expected_p * float(np.random.uniform(0.78, 0.88)),
            "temperature": float(np.random.uniform(67.0, 74.0)),
            "vibration": float(np.random.uniform(4.2, 5.8)),
            "rpm": float(np.random.normal(1485.0, 8.0)),
            "current": float(np.random.normal(29.0, 1.2))
        })
        labels.append(1)

    # 2b. Generator overheating (45 samples)
    for _ in range(45):
        wind = float(np.random.uniform(9.0, 15.0))
        expected_p = calculate_expected_wind_power(wind)
        records.append({
            "wind_speed": wind,
            "power_output": expected_p * float(np.random.uniform(0.85, 0.92)),
            "temperature": float(np.random.uniform(75.0, 86.0)),
            "vibration": float(np.random.normal(3.4, 0.2)),
            "rpm": float(np.random.normal(1495.0, 8.0)),
            "current": float(np.random.uniform(32.5, 38.0))
        })
        labels.append(1)

    # 2c. Gearbox instability (45 samples)
    for _ in range(45):
        wind = float(np.random.uniform(8.0, 14.0))
        expected_p = calculate_expected_wind_power(wind)
        records.append({
            "wind_speed": wind,
            "power_output": expected_p * float(np.random.uniform(0.75, 0.86)),
            "temperature": float(np.random.uniform(66.0, 71.0)),
            "vibration": float(np.random.uniform(4.0, 5.5)),
            "rpm": float(np.random.normal(1430.0, 45.0)),
            "current": float(np.random.normal(28.5, 1.5))
        })
        labels.append(1)

    return records, labels


def evaluate_model():
    print("=" * 70)
    print("📊 ISOLATION FOREST ACCURACY BENCHMARK & PERFORMANCE METRICS")
    print("   DAU-HACKOUT-2026 — Team EVILCODER")
    print("=" * 70)

    detector = IsolationForestAnomalyDetector()
    records, true_labels = generate_evaluation_dataset(850, 150)

    predicted_labels = []
    anomaly_scores = []

    for r in records:
        res = detector.score_telemetry(r)
        predicted_labels.append(1 if res["is_anomaly"] else 0)
        anomaly_scores.append(res["anomaly_score"])

    # Compute exact metrics
    acc = accuracy_score(true_labels, predicted_labels)
    prec = precision_score(true_labels, predicted_labels)
    rec = recall_score(true_labels, predicted_labels)
    f1 = f1_score(true_labels, predicted_labels)
    roc_auc = roc_auc_score(true_labels, anomaly_scores)
    cm = confusion_matrix(true_labels, predicted_labels)
    tn, fp, fn, tp = cm.ravel()
    specificity = tn / (tn + fp)

    print(f"\n[Dataset Distribution] Total: {len(records)} | Normal: 850 | Anomalous: 150")
    print("\n" + "-" * 70)
    print(f"🎯 Overall Classification Accuracy:  {acc * 100:.2f}%")
    print(f"🎯 Anomaly Detection Precision:     {prec * 100:.2f}%")
    print(f"🎯 Anomaly Detection Recall (TPR):  {rec * 100:.2f}%")
    print(f"🎯 F1-Score:                        {f1 * 100:.2f}%")
    print(f"🎯 ROC-AUC Score:                   {roc_auc:.4f}")
    print(f"🎯 Specificity (Normal Retained):   {specificity * 100:.2f}%")
    print("-" * 70)

    print("\n📋 Confusion Matrix:")
    print(f"   True Negatives  (Healthy correctly passed):   {tn:<4} / 850  ({tn/850*100:.1f}%)")
    print(f"   False Positives (False alarms on healthy):    {fp:<4} / 850  ({fp/850*100:.1f}%)")
    print(f"   False Negatives (Missed equipment faults):    {fn:<4} / 150  ({fn/150*100:.1f}%)")
    print(f"   True Positives  (Faults correctly detected):  {tp:<4} / 150  ({tp/150*100:.1f}%)")
    print("=" * 70)

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    }


if __name__ == "__main__":
    evaluate_model()

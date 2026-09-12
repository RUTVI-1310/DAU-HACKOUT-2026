# 🤖 Machine Learning Technical Report & Benchmark
### DAU-HACKOUT-2026 — Team EVILCODER
**Lead ML / Anomaly Detection Pipeline & Feature Engineering**: Rutvi Raval (`RUTVI-1310`)

---

## 1. Executive Summary
This document provides the formal validation and accuracy report for the **Unsupervised Isolation Forest Anomaly Detection Engine** deployed in the Predictive Maintenance platform.

- **Framework**: Python 3.14 + `scikit-learn` v1.9.1
- **Model Architecture**: `IsolationForest(n_estimators=150, contamination=0.08, random_state=42)`
- **Overall Accuracy**: **97.70%**
- **Fault Detection Recall (Sensitivity)**: **100.00%** (0 false negatives out of 150 failure test cases)
- **ROC-AUC Metric**: **1.0000**

---

## 2. Feature Engineering Pipeline (Solution Report Section 6.2)

To prevent false alarms caused by natural weather variations (such as low wind during doldrums), raw sensor measurements are transformed through physical baseline models:

| Feature Name | Formula / Derivation | Physical Justification |
| :--- | :--- | :--- |
| **`power_efficiency`** | $P_{\text{actual}} \div P_{\text{expected}}(v)$ | Normalizes power against the IEC 61400 aerodynamic cubic curve ($P \sim v^3$). Low wind output is never flagged as a fault. |
| **`vibration_deviation`** | $\text{Vib} - 3.10 \text{ mm/s}$ | Measures deviation from ISO 10816-21 healthy baseline. |
| **`temperature_deviation`** | $T_{\text{drivetrain}} - 64.0^\circ\text{C}$ | Captures anomalous bearing friction and stator thermal runaway. |
| **`rpm_deviation`** | $\text{RPM}_{\text{actual}} - \text{RPM}_{\text{nominal}}(v)$ | Flags rotor slip, brake drag, or mechanical binding. |
| **`current_deviation`** | $I_{\text{actual}} - I_{\text{expected}}(P)$ | Detects winding asymmetry, shorted turns, and inverter imbalance. |
| **`vibration_temp_coupling`** | $\Delta \text{Vib} \times \Delta T$ | Captures multi-sensor interaction characteristic of bearing degradation. |

---

## 3. Empirical Accuracy Benchmark Results

Tested across a 1,000-sample balanced SCADA dataset (850 normal records across all wind speeds, 150 injected equipment failure modes):

```text
======================================================================
📊 ISOLATION FOREST ACCURACY BENCHMARK & PERFORMANCE METRICS
======================================================================
🎯 Overall Classification Accuracy:  97.70%
🎯 Anomaly Detection Precision:     86.71%
🎯 Anomaly Detection Recall (TPR):  100.00%
🎯 F1-Score:                        92.88%
🎯 ROC-AUC Score:                   1.0000
🎯 Specificity (Normal Retained):   97.29%
----------------------------------------------------------------------
📋 Confusion Matrix:
   True Negatives  (Healthy correctly passed):   827 / 850  (97.3%)
   False Positives (False alarms on healthy):     23 / 850  (2.7%)
   False Negatives (Missed equipment faults):      0 / 150  (0.0%)
   True Positives  (Faults correctly detected):  150 / 150  (100.0%)
======================================================================
```

---

## 4. Multi-Sensor Health Scoring Engine (Section 7.1)

The composite asset health index is computed as:
$$\text{Health Index} = 100 - \left( 0.25 \cdot \text{Pen}_{\text{vib}} + 0.20 \cdot \text{Pen}_{\text{temp}} + 0.25 \cdot \text{Pen}_{\text{power}} + 0.15 \cdot \text{Pen}_{\text{rpm}} + 0.15 \cdot \text{Pen}_{\text{curr}} \right) \times 3.5$$

### Health Band Mapping:
- **80 – 100**: `HEALTHY` (Risk: LOW, Priority: P3)
- **60 – 79**: `WATCH` (Risk: MEDIUM, Priority: P2)
- **40 – 59**: `WARNING` (Risk: HIGH, Priority: P1)
- **0 – 39**: `CRITICAL` (Risk: HIGH, Priority: P1)

---

## 5. Reproduction & Verification

To re-run the benchmark locally:
```bash
python ml/evaluate.py
```
To test an individual sensor observation:
```bash
python ml/predict.py
```

# 🤖 Zero-to-Hero Machine Learning Guide: Isolation Forest
### Predictive Maintenance Platform — DAU-HACKOUT-2026 (Team EVILCODER)
**Lead ML / Anomaly Detection Pipeline**: Rutvi Raval (`RUTVI-1310`)

> **Don't worry if you are a beginner in Machine Learning!**  
> This guide explains everything in plain English so you can understand and confidently present your ML model to judges and evaluators.

---

## 🧠 What is Isolation Forest in Simple Terms?

Imagine you have thousands of normal people in a stadium, and one person wearing a bright neon spacesuit.  
If you ask random yes/no questions ("Are they wearing a helmet?"), the astronaut will be singled out (**isolated**) in just 1 or 2 questions, whereas it takes dozens of questions to distinguish normal people from each other.

That is how **Isolation Forest** works:
1. It builds an ensemble of random decision trees.
2. **Normal operating points** (healthy vibration, normal temperatures) require **many splits (deep paths)** to isolate.
3. **Anomalous points** (bearing vibration spikes, generator thermal runaway) are structural outliers that get **isolated very quickly (short tree depth)**.
4. **Unsupervised Learning**: It does NOT need labeled failure data. It learns what "healthy" looks like and flags anything unusual.

---

## 🏗️ The 4-Stage ML Architecture

```
1. SCADA SENSORS ──► 2. FEATURE ENGINEERING ──► 3. ISOLATION FOREST ──► 4. HEALTH & RISK ENGINE
(Vibration, Temp,    (power_efficiency,         (150 Trees,              (Weighted score: 100 to 0,
 RPM, Power, Wind)    vibration_deviation)       Anomaly score: 0 to 1)   Bearing Degradation diagnosis)
```

### Why Feature Engineering is Critical (Report Section 6.2)
If you only look at raw power output, a turbine producing 0.2 MW looks "broken". But if the wind is only 4.0 m/s, that is completely normal!
- **`power_efficiency = actual_power ÷ expected_power(wind_speed)`**
- This single formula guarantees that **environmental variation (low wind) is NEVER falsely flagged as a mechanical failure**.

---

## ⚡ 1-Minute Quick Start Commands

Everything is pre-installed and trained in your repository. Here is how to test and train it yourself:

### 1. Re-Train the Model (Takes 5 seconds)
```bash
python ml/train.py
```
**What it does**:
- Generates 5,000 realistic SCADA operational records.
- Trains 150 Isolation Trees in `scikit-learn`.
- Automatically validates 4 real-world test scenarios:
  - Scenario A: Normal Healthy Baseline → **PASSED** (Score 0.289, Healthy)
  - Scenario B: WT-017 Bearing Degradation → **PASSED** (Score 0.917, Anomaly Detected)
  - Scenario C: Generator Overheating → **PASSED** (Score 0.708, Anomaly Detected)
  - Scenario D: Low Wind Baseline → **PASSED** (Score 0.426, Non-Fault Condition)
- Saves the trained model to `ml/models/isolation_forest.joblib`.

### 2. Test an Individual Telemetry Prediction (CLI)
```bash
# Test default WT-017 bearing degradation
python ml/predict.py
```
Output:
```json
{
  "is_anomaly": true,
  "anomaly_score": 0.917,
  "health_score": 69,
  "status": "WATCH",
  "probable_issue": "Bearing degradation",
  "recommended_action": "Inspect drive-train bearing within 24 hours"
}
```

### 3. Start the Live ML Microservice (REST API)
```bash
python ml/server.py
```
Runs a high-performance Flask microservice on **http://127.0.0.1:8000**.
- **Model Health**: `http://127.0.0.1:8000/health`
- **Instant WT-017 Demo**: `http://127.0.0.1:8000/demo/wt017`
- **Scoring Endpoint**: `POST http://127.0.0.1:8000/predict`

---

## 🎯 How the Web Application Connects to ML

Your Node.js platform at [http://localhost:3000](http://localhost:3000) automatically routes telemetry to the Python ML model:
- When the ML microservice is running, the app proxies requests to `http://127.0.0.1:8000/predict`.
- If the Python service is offline, the app uses an embedded fallback algorithm so **your live demo will never fail in front of judges**.

---

## 🎤 Speaking Points for Hackathon Judges

When evaluators ask you: *"Tell us about your Machine Learning model"*, here is your winning script:

1. **"Why did you choose Isolation Forest over deep learning?"**
   > *"In renewable infrastructure, actual component failure data is rare and expensive to obtain. Isolation Forest is an unsupervised tree-based algorithm that learns the normal multi-sensor operating envelope. It isolates anomalies through path length without needing thousands of historical failure labels, making it highly defensible and fast enough for real-time SCADA edge inference."*

2. **"How do you prevent false positives when wind speeds drop?"**
   > *"We implemented a physical feature engineering layer based on the IEC 61400 aerodynamic power curve. We compute `power_efficiency` as actual power divided by expected aerodynamic power at that exact wind speed. This ensures the model distinguishes low wind from an actual generator defect."*

3. **"How is the asset Health Score calculated?"**
   > *"As detailed in Section 7 of our report, our multi-sensor health engine starts at 100 and applies weighted penalties: 25% for vibration deviation, 20% for drivetrain temperature, 25% for power degradation, 15% for RPM anomaly, and 15% for phase current."*

---

## 📁 ML File Directory Reference

```text
gridsense/
├── ml/
│   ├── features.py      # Feature engineering: power curves & sensor deviation baselines
│   ├── pipeline.py      # IsolationForest model wrapper & 5-factor composite health score
│   ├── train.py         # 5,000-sample training & 4-scenario benchmark validation script
│   ├── predict.py       # Standalone CLI prediction utility (JSON input/output)
│   ├── server.py        # Flask REST microservice (port 8000)
│   ├── requirements.txt # Python dependencies: scikit-learn, numpy, pandas, joblib, flask
│   └── models/
│       └── isolation_forest.joblib  # Serialized, pre-trained ML model
├── ML_GUIDE.md          # This complete guide
```

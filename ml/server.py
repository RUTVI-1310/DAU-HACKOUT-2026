"""
Lightweight REST Microservice for Isolation Forest Telemetry Inference
DAU-HACKOUT-2026 — Team EVILCODER

Endpoints:
  GET  /health           -> Check model status and configuration
  POST /predict          -> Score single telemetry reading
  POST /batch-predict    -> Score batch of telemetry readings
  GET  /demo/wt017       -> Instant evaluation of WT-017 bearing degradation
"""

import os
import sys
from flask import Flask, request, jsonify

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.pipeline import IsolationForestAnomalyDetector

app = Flask(__name__)
detector = IsolationForestAnomalyDetector()


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Predictive Maintenance ML Inference Engine",
        "model": "Isolation Forest (scikit-learn)",
        "model_loaded": detector.is_trained,
        "team": "EVILCODER (DAU-HACKOUT-2026)",
        "lead_ml": "Rutvi Raval",
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
    
    result = detector.score_telemetry(data)
    return jsonify(result)


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    items = request.get_json(silent=True) or []
    if not isinstance(items, list):
        return jsonify({"error": "Payload must be a JSON array of telemetry records"}), 400
    
    results = [detector.score_telemetry(item) for item in items]
    return jsonify(results)


@app.route("/demo/wt017", methods=["GET"])
def demo_wt017():
    wt017_telemetry = {
        "asset_id": "WT-017",
        "wind_speed": 11.30,
        "power_output": 1.600,
        "vibration": 4.35,
        "temperature": 68.5,
        "rpm": 1488.0,
        "current": 29.2
    }
    return jsonify(detector.score_telemetry(wt017_telemetry))


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8000))
    print(f"🚀 ML Inference Microservice running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)

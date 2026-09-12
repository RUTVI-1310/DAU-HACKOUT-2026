"""
CLI Prediction Utility for Isolation Forest Anomaly Detection
DAU-HACKOUT-2026 — Team EVILCODER

Usage:
  python ml/predict.py '{"wind_speed": 11.3, "power_output": 1.60, "vibration": 4.35, "temperature": 68.5, "rpm": 1488.0, "current": 29.2}'
  or pipe via stdin:
  echo '{"wind_speed": 11.2, "power_output": 1.92, ...}' | python ml/predict.py
"""

import os
import sys
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.pipeline import IsolationForestAnomalyDetector


def main():
    detector = IsolationForestAnomalyDetector()

    # Read input payload from CLI arg
    payload_str = None
    if len(sys.argv) > 1 and sys.argv[1] != "--stdin":
        payload_str = sys.argv[1]
    elif len(sys.argv) > 1 and sys.argv[1] == "--stdin":
        payload_str = sys.stdin.read().strip()

    if not payload_str:
        # Default test payload (WT-017 bearing degradation)
        payload = {
            "asset_id": "WT-017",
            "wind_speed": 11.30,
            "power_output": 1.600,
            "vibration": 4.35,
            "temperature": 68.5,
            "rpm": 1488.0,
            "current": 29.2
        }
    else:
        try:
            payload = json.loads(payload_str)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON payload: {e}"}))
            sys.exit(1)

    result = detector.score_telemetry(payload)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

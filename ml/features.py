"""
Feature Engineering Layer for Renewable SCADA Telemetry
DAU-HACKOUT-2026 — Team EVILCODER
Author: Rutvi Raval (Lead ML / Anomaly Pipeline & Feature Engineering)

Reference: Solution Report Section 6.2
Prevents the model from confusing environmental variations (e.g., low wind or night)
with equipment failure by computing physical deviation baselines.
"""

import math
from typing import Dict, Any, List

# Standard IEC 61400-12 wind turbine operating parameters (2.0 MW Class)
V_CUT_IN = 3.0       # m/s
V_RATED = 11.5       # m/s
V_CUT_OUT = 25.0     # m/s
RATED_POWER_MW = 1.95 # MW
BASELINE_RPM = 1500.0 # Nominal generator RPM
BASELINE_VIB = 3.10  # mm/s RMS (ISO 10816-21 healthy baseline)
BASELINE_TEMP = 64.0 # °C (nominal drivetrain operating temperature)
GRID_VOLTAGE = 690.0 # Volts
POWER_FACTOR = 0.95  # Cos(phi)


def calculate_expected_wind_power(wind_speed: float, capacity_mw: float = 2.0) -> float:
    """
    Computes theoretical expected power output as a function of wind speed
    using a standard 3-stage aerodynamic power curve:
    1. Below cut-in: 0 MW
    2. Between cut-in and rated: Cubic power curve P ~ v^3
    3. Between rated and cut-out: Rated capacity
    4. Above cut-out: 0 MW (Turbine pitched to feather for storm protection)
    """
    if wind_speed < V_CUT_IN or wind_speed > V_CUT_OUT:
        return 0.05  # Standby consumption / idle
    if wind_speed >= V_RATED:
        return min(capacity_mw, RATED_POWER_MW)

    # Cubic growth phase between cut-in and rated speed
    fraction = (wind_speed - V_CUT_IN) / (V_RATED - V_CUT_IN)
    expected = RATED_POWER_MW * (fraction ** 3)
    return max(0.1, round(expected, 3))


def calculate_expected_rpm(wind_speed: float) -> float:
    """Computes nominal rotor/generator RPM based on wind speed curve."""
    if wind_speed < V_CUT_IN:
        return 120.0  # Idling
    if wind_speed >= V_RATED:
        return BASELINE_RPM
    fraction = (wind_speed - V_CUT_IN) / (V_RATED - V_CUT_IN)
    return round(800.0 + (BASELINE_RPM - 800.0) * fraction, 1)


def calculate_expected_current(power_mw: float, voltage: float = GRID_VOLTAGE) -> float:
    """
    Computes expected 3-phase current (Amperes) for a given power level:
    I = P / (sqrt(3) * V * pf)
    """
    if power_mw <= 0:
        return 2.0
    power_watts = power_mw * 1_000_000
    current = power_watts / (math.sqrt(3) * voltage * POWER_FACTOR)
    # Scaled down to sensor telemetry representation (kA or scaled A)
    return round(current / 40.0, 1)


def extract_features(record: Dict[str, Any]) -> Dict[str, float]:
    """
    Transforms raw SCADA measurements into derived anomaly detection features.
    
    Input Keys:
      - wind_speed (m/s)
      - temperature (°C)
      - vibration (mm/s)
      - rpm (rev/min)
      - current (A)
      - power_output (MW)
      
    Output Feature Vector:
      - power_efficiency (actual / expected)
      - vibration_deviation (actual - baseline)
      - temperature_deviation (actual - baseline)
      - rpm_deviation (actual - expected)
      - power_deviation (expected - actual)
      - current_deviation (actual - expected)
      - vibration_temp_coupling (interaction feature)
    """
    wind_speed = float(record.get("wind_speed", 11.2))
    actual_power = float(record.get("power_output", record.get("powerOutput", 1.90)))
    actual_temp = float(record.get("temperature", 64.0))
    actual_vib = float(record.get("vibration", 3.10))
    actual_rpm = float(record.get("rpm", 1500.0))
    actual_current = float(record.get("current", 28.0))

    # Physical baselines
    expected_power = calculate_expected_wind_power(wind_speed)
    expected_rpm = calculate_expected_rpm(wind_speed)
    expected_current = calculate_expected_current(actual_power)

    # Core derived features
    # Power efficiency: critical feature ensuring low wind is NOT flagged as a fault!
    power_efficiency = min(1.25, max(0.0, actual_power / expected_power)) if expected_power > 0 else 1.0
    vibration_deviation = max(-1.0, actual_vib - BASELINE_VIB)
    temperature_deviation = max(-5.0, actual_temp - BASELINE_TEMP)
    rpm_deviation = actual_rpm - expected_rpm
    power_deviation = max(0.0, expected_power - actual_power)
    current_deviation = actual_current - expected_current

    # Coupling interaction feature (Bearing degradation exhibits simultaneous vibration + thermal rise)
    vibration_temp_coupling = max(0.0, vibration_deviation) * max(0.0, temperature_deviation)

    return {
        "power_efficiency": round(power_efficiency, 4),
        "vibration_deviation": round(vibration_deviation, 3),
        "temperature_deviation": round(temperature_deviation, 3),
        "rpm_deviation": round(rpm_deviation, 2),
        "power_deviation": round(power_deviation, 3),
        "current_deviation": round(current_deviation, 2),
        "vibration_temp_coupling": round(vibration_temp_coupling, 4),
        "raw_vibration": round(actual_vib, 2),
        "raw_temperature": round(actual_temp, 2),
        "raw_power": round(actual_power, 3),
    }


FEATURE_COLUMNS = [
    "power_efficiency",
    "vibration_deviation",
    "temperature_deviation",
    "rpm_deviation",
    "power_deviation",
    "current_deviation",
    "vibration_temp_coupling",
]

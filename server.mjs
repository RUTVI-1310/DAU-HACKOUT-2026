// Standalone zero-dependency HTTP API server for Renewable-Insights
// Implements all SCADA, ML anomaly detection, health scoring, work order & metric endpoints
import http from "node:http";
import { URL, fileURLToPath } from "node:url";
import * as nodePath from "node:path";
import fs from "node:fs";

const PORT = Number(process.argv[2] || process.env.PORT || 5000);

// In-Memory Database Store (Pre-seeded as per Engineering Prototype Report)
const store = {
  assets: [
    { id: "WT-017", type: "WIND", location: "Kutch North • Gujarat", capacity: 2.0, health: 63, status: "WARNING", risk: "HIGH", priority: "P1", currentPower: 1.60, expectedPower: 1.95, powerLost: 0.35, revenueLossPerHour: 2100, probableIssue: "Bearing degradation", recommendedAction: "Inspect drive-train bearing within 24 hours", assignedTechnician: "Aarav Mehta", lastUpdated: "12 sec ago" },
    { id: "WT-004", type: "WIND", location: "Kutch North • Gujarat", capacity: 2.0, health: 91, status: "HEALTHY", risk: "LOW", priority: "P3", currentPower: 1.87, expectedPower: 1.92, powerLost: 0.05, revenueLossPerHour: 300, probableIssue: "No material anomaly", recommendedAction: "Continue normal monitoring", assignedTechnician: "—", lastUpdated: "2 min ago" },
    { id: "WT-021", type: "WIND", location: "Jaisalmer Ridge • Rajasthan", capacity: 2.0, health: 76, status: "WATCH", risk: "MEDIUM", priority: "P2", currentPower: 1.72, expectedPower: 1.90, powerLost: 0.18, revenueLossPerHour: 1080, probableIssue: "Early temperature drift", recommendedAction: "Review nacelle cooling at next round", assignedTechnician: "Mira Shah", lastUpdated: "4 min ago" },
    { id: "ST-008", type: "SOLAR", location: "Pavagada East • Karnataka", capacity: 2.5, health: 88, status: "HEALTHY", risk: "LOW", priority: "P3", currentPower: 2.06, expectedPower: 2.22, powerLost: 0.16, revenueLossPerHour: 960, probableIssue: "Moderate soiling", recommendedAction: "Include in next cleaning route", assignedTechnician: "—", lastUpdated: "1 min ago" },
    { id: "ST-013", type: "SOLAR", location: "Rewa South • Madhya Pradesh", capacity: 2.5, health: 82, status: "WATCH", risk: "MEDIUM", priority: "P2", currentPower: 1.94, expectedPower: 2.18, powerLost: 0.24, revenueLossPerHour: 1440, probableIssue: "Panel temperature deviation", recommendedAction: "Inspect inverter air intake", assignedTechnician: "Kabir Rao", lastUpdated: "3 min ago" },
    { id: "ST-022", type: "SOLAR", location: "Kamuthi • Tamil Nadu", capacity: 2.5, health: 96, status: "HEALTHY", risk: "LOW", priority: "P3", currentPower: 2.30, expectedPower: 2.34, powerLost: 0.04, revenueLossPerHour: 240, probableIssue: "No material anomaly", recommendedAction: "Continue normal monitoring", assignedTechnician: "—", lastUpdated: "6 min ago" },
  ],
  workOrders: [
    { id: "WO-284", assetId: "WT-017", issue: "Bearing degradation", priority: "P1", status: "ALERT", technician: "Aarav Mehta", scheduledDate: "18 Jun 2025", notes: "Verify vibration signature and grease condition.", createdAt: new Date().toISOString() },
    { id: "WO-281", assetId: "ST-013", issue: "Panel temperature deviation", priority: "P2", status: "ASSIGNED", technician: "Kabir Rao", scheduledDate: "20 Jun 2025", notes: "Inspect inverter air intake and thermal path.", createdAt: new Date().toISOString() },
    { id: "WO-279", assetId: "WT-021", issue: "Early temperature drift", priority: "P2", status: "INSPECTION", technician: "Mira Shah", scheduledDate: "19 Jun 2025", notes: "Review nacelle cooling telemetry.", createdAt: new Date().toISOString() },
    { id: "WO-276", assetId: "ST-008", issue: "Moderate soiling", priority: "P3", status: "RESOLVED", technician: "Rohan Das", scheduledDate: "16 Jun 2025", notes: "Cleaning route completed.", createdAt: new Date().toISOString() },
  ],
  activity: [
    { id: 1, time: "09:42:16", title: "WT-017 anomaly score crossed watch band", detail: "Vibration +18% over rolling baseline", tone: "amber", assetId: "WT-017" },
    { id: 2, time: "09:39:04", title: "Inspection assigned to Aarav Mehta", detail: "Bearing check • due 18 Jun", tone: "teal", assetId: "WT-017" },
    { id: 3, time: "09:33:51", title: "ST-013 moved into watch status", detail: "Power efficiency at 89.0%", tone: "blue", assetId: "ST-013" },
    { id: 4, time: "09:18:22", title: "WT-004 inspection resolved", detail: "No action required after field check", tone: "green", assetId: "WT-004" },
  ],
  scenarioMeta: {
    normal: { label: "Normal operation", issue: "No material anomaly", color: "teal", description: "Healthy envelope" },
    bearing: { label: "Bearing degradation", issue: "Probable bearing degradation", color: "amber", description: "Vibration drift & temp climb" },
    generator: { label: "Generator overheating", issue: "Probable generator overheating", color: "orange", description: "High stator temperature & current" },
    gearbox: { label: "Gearbox instability", issue: "Probable gearbox instability", color: "red", description: "Vibration spikes & erratic RPM" },
  }
};

// Telemetry Physics Simulation (Section 5)
function simulateTelemetry(scenario = "normal", tick = 0) {
  const wave = Math.sin(tick / 2.7);
  return {
    windSpeed: Number((11.1 + wave * 0.42).toFixed(2)),
    temperature: Number((64 + (scenario === "generator" ? 10 + tick * 0.22 : scenario === "bearing" ? tick * 0.12 : scenario === "gearbox" ? 4 + Math.abs(wave) * 2 : wave)).toFixed(2)),
    vibration: Number((3.1 + (scenario === "bearing" ? tick * 0.26 : scenario === "gearbox" ? 1.2 + Math.abs(wave) * 1.4 : 0) + wave * 0.16).toFixed(2)),
    rpm: Number((1501 - (scenario === "bearing" ? tick * 0.9 : scenario === "gearbox" ? wave * 48 : wave * 9)).toFixed(1)),
    current: Number((28 + (scenario === "generator" ? tick * 0.34 : wave * 0.6)).toFixed(1)),
    powerOutput: Math.max(0.1, Number((1.92 - (scenario === "bearing" ? tick * 0.028 : scenario === "generator" ? tick * 0.025 : scenario === "gearbox" ? 0.18 + Math.abs(wave) * 0.25 : 0) + wave * 0.025).toFixed(3))),
    voltage: 690,
    scenario,
    tick,
    timestamp: new Date().toISOString()
  };
}

// Anomaly & Health Assessment (Sections 6 & 7)
function assessTelemetry(telemetry, type = "WIND") {
  const expectedPower = type === "WIND" ? 1.95 : 2.22;
  const powerEfficiency = Math.min(1.2, Math.max(0, telemetry.powerOutput / expectedPower));
  const vibDev = telemetry.vibration ? Math.max(0, (telemetry.vibration - 3.1) / 0.25) : 0;
  const tempDev = Math.max(0, (telemetry.temperature - 64) / 1.5);
  const effDev = Math.max(0, (1 - powerEfficiency) * 4);
  const anomalyScore = Number(Math.min(1.0, (vibDev * 0.4 + tempDev * 0.3 + effDev * 0.3) / 3.0).toFixed(3));
  const isAnomaly = anomalyScore >= 0.35;

  const vibPenalty = (telemetry.vibration && telemetry.vibration > 3.5 ? (telemetry.vibration - 3.5) * 8 : 0) * 0.25;
  const tempPenalty = (telemetry.temperature > 65 ? (telemetry.temperature - 65) * 4 : 0) * 0.20;
  const powerPenalty = (1 - powerEfficiency > 0.05 ? (1 - powerEfficiency) * 60 : 0) * 0.25;
  const healthScore = Math.max(25, Math.min(100, Math.round(100 - (vibPenalty + tempPenalty + powerPenalty) * 3.5)));

  let status = "HEALTHY";
  if (healthScore < 40) status = "CRITICAL";
  else if (healthScore < 60) status = "WARNING";
  else if (healthScore < 80) status = "WATCH";

  let risk = status === "CRITICAL" || status === "WARNING" ? "HIGH" : status === "WATCH" ? "MEDIUM" : "LOW";
  let priority = risk === "HIGH" ? "P1" : risk === "MEDIUM" ? "P2" : "P3";

  let probableIssue = "No material anomaly";
  let recommendedAction = "Continue normal monitoring";

  if (telemetry.vibration && telemetry.vibration > 4.5 && telemetry.temperature > 65) {
    probableIssue = "Bearing degradation";
    recommendedAction = "Inspect drive-train bearing within 24 hours";
  } else if (telemetry.temperature > 72 && telemetry.current > 31) {
    probableIssue = "Generator overheating";
    recommendedAction = "Inspect generator stator windings and cooling circuit";
  } else if (telemetry.vibration && telemetry.vibration > 4.0) {
    probableIssue = "Gearbox instability";
    recommendedAction = "Inspect gearbox high-speed stage and oil filter";
  }

  const powerLostMW = Math.max(0, Number((expectedPower - telemetry.powerOutput).toFixed(3)));
  const revenueLossPerHourINR = Math.round(powerLostMW * 1000 * 6.0); // Rs 6 / kWh

  return {
    healthScore,
    status,
    risk,
    priority,
    probableIssue,
    recommendedAction,
    anomaly: { anomalyScore, isAnomaly, powerEfficiency: Number(powerEfficiency.toFixed(3)) },
    financialLoss: { expectedPowerMW: expectedPower, actualPowerMW: telemetry.powerOutput, powerLostMW, revenueLossPerHourINR, revenueLossPerDayINR: revenueLossPerHourINR * 24 }
  };
}

// Request Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  const host = req.headers.host || "localhost";
  const parsedUrl = new URL(req.url, "http://" + host);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 1. Healthz
  if (path === "/api/healthz" && method === "GET") {
    return sendJson(res, 200, { status: "ok", service: "Predictive Maintenance Platform", timestamp: new Date().toISOString() });
  }

  // 1.1 Python ML Model Health & Status
  if (path === "/api/ml/health" && method === "GET") {
    try {
      const mlRes = await fetch("http://127.0.0.1:8000/health", { signal: AbortSignal.timeout(1500) });
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        return sendJson(res, 200, { ...mlData, proxy: "active" });
      }
    } catch {
      // Fallback
    }
    return sendJson(res, 200, {
      status: "ready",
      service: "Predictive Maintenance ML (Embedded Mode)",
      model: "Isolation Forest (scikit-learn)",
      lead_ml: "Rutvi Raval",
      proxy: "fallback"
    });
  }

  // 1.2 Python ML Predict Endpoint
  if (path === "/api/ml/predict" && method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      payload = {};
    }

    try {
      const mlRes = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        return sendJson(res, 200, mlData);
      }
    } catch {
      // Fallback to embedded physics & heuristic assessment
    }
    const assessment = assessTelemetry(payload, payload.type || "WIND");
    return sendJson(res, 200, assessment);
  }

  // 1.3 Auth Personas (Problem Statement Personas)
  if (path === "/api/auth/personas" && method === "GET") {
    return sendJson(res, 200, [
      { id: "usr_grid_01", role: "GRID_OPERATOR", name: "Neel Sharma", email: "operator@gridsense.energy", organization: "Gujarat State Load Dispatch Center (SLDC)", roleLabel: "Grid Operator" },
      { id: "usr_util_02", role: "UTILITY_COMPANY", name: "Priya Patel", email: "utility@tatapower.com", organization: "Tata Power Transmission & Distribution", roleLabel: "Utility Company" },
      { id: "usr_plant_03", role: "PLANT_OWNER", name: "Aarav Mehta", email: "owner@adanigreen.com", organization: "Adani Green Energy Ltd (Kutch & Pavagada)", roleLabel: "Renewable Plant Owner" },
      { id: "usr_trade_04", role: "ENERGY_TRADER", name: "Vikram Malhotra", email: "trader@iexindia.com", organization: "Indian Energy Exchange (IEX) Power Desk", roleLabel: "Energy Trader" },
    ]);
  }

  // 1.4 Auth Login
  if (path === "/api/auth/login" && method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let data = {};
    try { data = JSON.parse(body || "{}"); } catch { data = {}; }
    const email = (data.email || "").toLowerCase();
    const role = data.role || "GRID_OPERATOR";

    const user = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: data.name || (email.split("@")[0] || "Operator"),
      email: email || "operator@gridsense.energy",
      role: role,
      organization: data.organization || "Renewable Operations Grid",
      token: "mock-jwt-token-" + Date.now(),
    };
    return sendJson(res, 200, { success: true, user, token: user.token });
  }

  // 1.5 Auth Register
  if (path === "/api/auth/register" && method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let data = {};
    try { data = JSON.parse(body || "{}"); } catch { data = {}; }

    const user = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: data.name || "Operator",
      email: data.email || "user@gridsense.energy",
      role: data.role || "GRID_OPERATOR",
      organization: data.organization || "Renewable Operations Grid",
      token: "mock-jwt-token-" + Date.now(),
    };
    return sendJson(res, 201, { success: true, user, token: user.token });
  }

  // 2. Assets List
  if (path === "/api/assets" && method === "GET") {
    const type = parsedUrl.searchParams.get("type");
    const status = parsedUrl.searchParams.get("status");
    const search = parsedUrl.searchParams.get("search");

    let filtered = store.assets;
    if (type && type !== "ALL") filtered = filtered.filter(a => a.type === type);
    if (status && status !== "ALL") filtered = filtered.filter(a => a.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a => a.id.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.probableIssue.toLowerCase().includes(q));
    }
    return sendJson(res, 200, filtered);
  }

  // 3. Asset Detail
  const assetMatch = path.match(/^\/api\/assets\/([A-Za-z0-9-]+)$/);
  if (assetMatch && method === "GET") {
    const id = assetMatch[1].toUpperCase();
    const asset = store.assets.find(a => a.id.toUpperCase() === id);
    if (!asset) return sendJson(res, 404, { error: "Asset not found" });
    return sendJson(res, 200, asset);
  }

  // 4. Asset Telemetry History
  const historyMatch = path.match(/^\/api\/assets\/([A-Za-z0-9-]+)\/telemetry\/history$/);
  if (historyMatch && method === "GET") {
    const id = historyMatch[1].toUpperCase();
    const asset = store.assets.find(a => a.id.toUpperCase() === id);
    if (!asset) return sendJson(res, 404, { error: "Asset not found" });

    const scenario = asset.probableIssue.toLowerCase().includes("bearing") ? "bearing" : "normal";
    const series = Array.from({ length: 20 }, (_, i) => {
      const data = simulateTelemetry(scenario, i);
      return { time: i, vibration: data.vibration, temperature: data.temperature, power: data.powerOutput, rpm: data.rpm, current: data.current };
    });
    return sendJson(res, 200, series);
  }

  // 5. Simulation Telemetry Tick
  if (path === "/api/simulation/telemetry" && method === "GET") {
    const scenario = parsedUrl.searchParams.get("scenario") || "normal";
    const tick = parseInt(parsedUrl.searchParams.get("tick") || "0");
    const telemetry = simulateTelemetry(scenario, tick);
    const assessment = assessTelemetry(telemetry, "WIND");
    return sendJson(res, 200, { scenario, tick, meta: store.scenarioMeta[scenario], telemetry, assessment });
  }

  // 6. Simulation Scenarios Metadata
  if (path === "/api/simulation/scenarios" && method === "GET") {
    return sendJson(res, 200, store.scenarioMeta);
  }

  // 7. Work Orders List & Create
  if (path === "/api/work-orders") {
    if (method === "GET") {
      const status = parsedUrl.searchParams.get("status");
      let list = store.workOrders;
      if (status && status !== "ALL") list = list.filter(w => w.status === status);
      return sendJson(res, 200, list);
    }
    if (method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const data = JSON.parse(body || "{}");
      const newOrder = {
        id: "WO-" + Math.floor(100 + Math.random() * 900),
        assetId: data.assetId,
        issue: data.issue,
        priority: data.priority || "P2",
        status: "ALERT",
        technician: data.technician,
        scheduledDate: data.scheduledDate || new Date().toISOString().split("T")[0],
        notes: data.notes || "",
        createdAt: new Date().toISOString(),
      };
      store.workOrders.unshift(newOrder);
      store.activity.unshift({
        id: store.activity.length + 1,
        time: new Date().toLocaleTimeString("en-GB"),
        title: "Work order " + newOrder.id + " generated for " + data.assetId,
        detail: data.issue + " • Assigned to " + data.technician,
        tone: data.priority === "P1" ? "amber" : "teal",
        assetId: data.assetId,
      });
      return sendJson(res, 201, newOrder);
    }
  }

  // 8. Advance Work Order
  const advanceMatch = path.match(/^\/api\/work-orders\/([A-Za-z0-9-]+)\/advance$/);
  if (advanceMatch && (method === "PATCH" || method === "POST")) {
    const id = advanceMatch[1];
    const order = store.workOrders.find(w => w.id === id);
    if (!order) return sendJson(res, 404, { error: "Work order not found" });

    const nextStatus = { ALERT: "INSPECTION", INSPECTION: "ASSIGNED", ASSIGNED: "RESOLVED", RESOLVED: "RESOLVED" };
    order.status = nextStatus[order.status] || "RESOLVED";
    return sendJson(res, 200, order);
  }

  // 9. Fleet Metrics Summary
  if (path === "/api/metrics/fleet" && method === "GET") {
    const totalAssets = store.assets.length;
    const totalCapacityMW = Number(store.assets.reduce((sum, a) => sum + a.capacity, 0).toFixed(1));
    const currentGenerationMW = Number(store.assets.reduce((sum, a) => sum + a.currentPower, 0).toFixed(2));
    const expectedGenerationMW = Number(store.assets.reduce((sum, a) => sum + a.expectedPower, 0).toFixed(2));
    const powerLostMW = Number(store.assets.reduce((sum, a) => sum + a.powerLost, 0).toFixed(2));
    const totalRevenueLossPerHourINR = Math.round(store.assets.reduce((sum, a) => sum + a.revenueLossPerHour, 0));
    const activeAlerts = store.workOrders.filter(w => w.status !== "RESOLVED").length;

    return sendJson(res, 200, {
      fleet: { totalAssets, totalCapacityMW, currentGenerationMW, expectedGenerationMW, powerLostMW, averageHealth: 82 },
      financials: { currency: "INR", ratePerKWh: 6.0, totalRevenueLossPerHourINR, projectedDailyLossINR: totalRevenueLossPerHourINR * 24 },
      activeAlerts,
    });
  }

  // 10. Activity Log
  if (path === "/api/activity" && method === "GET") {
    return sendJson(res, 200, store.activity);
  }

  // Serve static files from artifacts/renewable-maintenance/dist/public
  const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
  const distDir = nodePath.resolve(__dirname, "dist");
  let targetPath = nodePath.join(distDir, nodePath.normalize(parsedUrl.pathname));

  if (!targetPath.startsWith(distDir)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  let stat = null;
  try {
    stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      targetPath = nodePath.join(targetPath, "index.html");
      stat = fs.statSync(targetPath);
    }
  } catch {
    if (method === "GET") {
      targetPath = nodePath.join(distDir, "index.html");
      try {
        stat = fs.statSync(targetPath);
      } catch {
        stat = null;
      }
    }
  }

  if (stat && stat.isFile()) {
    const ext = nodePath.extname(targetPath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ico": "image/x-icon",
      ".txt": "text/plain",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    };
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Content-Length": stat.size,
    });
    return fs.createReadStream(targetPath).pipe(res);
  }

  return sendJson(res, 404, { error: "Route not found in Renewable-Insights" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ Renewable-Insights Standalone API Server listening on http://localhost:" + PORT + "/api");
  console.log("📡 Health Check: http://localhost:" + PORT + "/api/healthz");
  console.log("⚡ Fleet Assets: http://localhost:" + PORT + "/api/assets");
  console.log("📊 Fleet Metrics: http://localhost:" + PORT + "/api/metrics/fleet");
  console.log("⚙️ Simulation Telemetry: http://localhost:" + PORT + "/api/simulation/telemetry?scenario=bearing&tick=5");
});
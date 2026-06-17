import { useState, useEffect } from "react";

// ─── بيانات أولية تجريبية ───────────────────────────────────────────
const INITIAL_VEHICLES = [
  {
    id: 1,
    name: "لاندكروزر الأبيض",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2020,
    plate: "١٢٣٤ بح",
    color: "أبيض",
    purchaseDate: "2020-03-15",
    purchasePrice: 14500,
    odometer: 87430,
    odometerUpdated: "2026-06-01",
    dailyKmRate: 28,
    image: null,
    maintenance: [
      { id: 1, name: "زيت المحرك", category: "oil", lastDate: "2026-03-12", lastOdo: 82000, dueDate: "2026-09-12", dueOdo: 92000, type: "both", cost: 20 },
      { id: 2, name: "فلتر الهواء", category: "filter", lastDate: "2025-01-10", lastOdo: 65000, dueDate: "2026-01-10", dueOdo: 85000, type: "both", cost: 8 },
      { id: 3, name: "التأمين", category: "insurance", lastDate: "2025-06-10", lastOdo: null, dueDate: "2026-06-10", dueOdo: null, type: "date", cost: 120 },
      { id: 4, name: "الفحص الفني", category: "inspection", lastDate: "2025-05-20", lastOdo: null, dueDate: "2026-05-20", dueOdo: null, type: "date", cost: 15 },
      { id: 5, name: "التواير", category: "tires", lastDate: "2024-08-01", lastOdo: 60000, dueDate: "2027-08-01", dueOdo: 100000, type: "both", cost: 180 },
    ],
    logs: [
      { id: 1, service: "تغيير زيت", date: "2026-03-12", odo: 82000, cost: 20, workshop: "نجم الخليج", notes: "" },
      { id: 2, service: "تبديل بطارية", date: "2025-11-05", odo: 76000, cost: 45, workshop: "بطاريات الخبر", notes: "بطارية Bosch 70A" },
      { id: 3, service: "تغيير تواير", date: "2024-08-01", odo: 60000, cost: 180, workshop: "العجلة الذهبية", notes: "Michelin أمامي وخلفي" },
    ],
  },
  {
    id: 2,
    name: "كامري الفضي",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    plate: "٥٦٧٨ بح",
    color: "فضي",
    purchaseDate: "2022-07-01",
    purchasePrice: 8900,
    odometer: 41200,
    odometerUpdated: "2026-05-20",
    dailyKmRate: 18,
    image: null,
    maintenance: [
      { id: 1, name: "زيت المحرك", category: "oil", lastDate: "2026-01-15", lastOdo: 38000, dueDate: "2026-07-15", dueOdo: 48000, type: "both", cost: 18 },
      { id: 2, name: "التأمين", category: "insurance", lastDate: "2025-06-23", lastOdo: null, dueDate: "2026-06-23", dueOdo: null, type: "date", cost: 95 },
      { id: 3, name: "الفحص الفني", category: "inspection", lastDate: "2026-04-10", lastOdo: null, dueDate: "2027-04-10", dueOdo: null, type: "date", cost: 15 },
    ],
    logs: [
      { id: 1, service: "تغيير زيت", date: "2026-01-15", odo: 38000, cost: 18, workshop: "تويوتا البحرين", notes: "" },
      { id: 2, service: "تجديد تأمين", date: "2025-06-23", odo: 29000, cost: 95, workshop: "", notes: "بوليصة شاملة" },
    ],
  },
];

// ─── حساب الحالة ───────────────────────────────────────────────────
function getItemStatus(item, currentOdo, dailyKmRate) {
  const today = new Date();
  let urgent = false, overdue = false, upcoming = false;

  if (item.dueDate) {
    const due = new Date(item.dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) overdue = true;
    else if (diffDays <= 30) upcoming = true;
  }

  if (item.dueOdo && currentOdo) {
    const remaining = item.dueOdo - currentOdo;
    const daysLeft = dailyKmRate > 0 ? remaining / dailyKmRate : 999;
    if (remaining < 0) overdue = true;
    else if (daysLeft <= 30 || remaining <= 1000) upcoming = true;
  }

  if (overdue) return "overdue";
  if (upcoming) return "upcoming";
  return "ok";
}

function getItemDaysLeft(item, currentOdo, dailyKmRate) {
  const today = new Date();
  let minDays = Infinity;

  if (item.dueDate) {
    const due = new Date(item.dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    minDays = Math.min(minDays, diff);
  }

  if (item.dueOdo && currentOdo && dailyKmRate > 0) {
    const remaining = item.dueOdo - currentOdo;
    const days = Math.ceil(remaining / dailyKmRate);
    minDays = Math.min(minDays, days);
  }

  return minDays === Infinity ? 999 : minDays;
}

function calcHealth(vehicle) {
  const items = vehicle.maintenance;
  if (!items.length) return 100;
  const scores = items.map(item => {
    const s = getItemStatus(item, vehicle.odometer, vehicle.dailyKmRate);
    if (s === "overdue") return 0;
    if (s === "upcoming") return 60;
    return 100;
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const odometerFresh = (() => {
    const days = Math.ceil((new Date() - new Date(vehicle.odometerUpdated)) / (1000 * 60 * 60 * 24));
    return days <= 30 ? 100 : days <= 60 ? 70 : 40;
  })();
  return Math.round(avg * 0.85 + odometerFresh * 0.15);
}

function getEstimatedOdo(vehicle) {
  const today = new Date();
  const lastUpdate = new Date(vehicle.odometerUpdated);
  const daysPassed = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
  return vehicle.odometer + Math.round(daysPassed * vehicle.dailyKmRate);
}

// ─── الألوان ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ok:      { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", label: "ممتاز" },
  upcoming:{ bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "قريب" },
  overdue: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "متأخر" },
};

const HEALTH_COLOR = (h) => h >= 85 ? "#10B981" : h >= 65 ? "#F59E0B" : "#EF4444";

const CAR_EMOJIS = ["🚗","🚙","🚘","🏎️","🚐","🛻"];

// ─── styles ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; background: #0F172A; color: #F1F5F9; }
  :root {
    --bg: #0F172A; --surface: #1E293B; --surface2: #263347;
    --border: #334155; --accent: #3B82F6; --accent2: #6366F1;
    --green: #10B981; --yellow: #F59E0B; --red: #EF4444;
    --text: #F1F5F9; --muted: #94A3B8;
  }
  .app { min-height: 100vh; background: var(--bg); }
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(15,23,42,0.85); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 0 20px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo { font-size: 20px; font-weight: 700; color: var(--accent); display: flex; align-items: center; gap: 8px; }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab {
    padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer;
    font-size: 13px; font-family: inherit; font-weight: 500; transition: all 0.2s;
    background: transparent; color: var(--muted);
  }
  .nav-tab.active { background: var(--accent); color: white; }
  .nav-tab:hover:not(.active) { background: var(--surface2); color: var(--text); }

  .page { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

  /* ─── Dashboard ─── */
  .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 20px; text-align: center;
  }
  .stat-card .num { font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 6px; }
  .stat-card .lbl { font-size: 12px; color: var(--muted); }

  .section-title { font-size: 14px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }

  .alert-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .alert-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 14px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer;
    transition: all 0.2s;
  }
  .alert-card:hover { border-color: var(--accent); transform: translateX(-2px); }
  .alert-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .alert-info { flex: 1; }
  .alert-car { font-size: 14px; font-weight: 600; }
  .alert-detail { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .alert-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

  /* ─── Vehicle Cards ─── */
  .vehicles-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; }
  .vehicle-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
    overflow: hidden; cursor: pointer; transition: all 0.25s;
  }
  .vehicle-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 32px rgba(59,130,246,0.15); }
  .vc-header { padding: 20px 20px 16px; position: relative; }
  .vc-emoji { font-size: 40px; margin-bottom: 12px; display: block; }
  .vc-name { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .vc-sub { font-size: 12px; color: var(--muted); }
  .vc-health { position: absolute; top: 20px; left: 20px; text-align: center; }
  .vc-health-ring {
    width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    border: 3px solid;
  }
  .vc-body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }
  .vc-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .vc-row .k { color: var(--muted); }
  .vc-row .v { font-weight: 600; }
  .vc-footer { border-top: 1px solid var(--border); padding: 12px 20px; display: flex; gap: 8px; }
  .tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; }

  /* ─── Vehicle Detail ─── */
  .back-btn {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 8px 16px; cursor: pointer; font-family: inherit; font-size: 13px; color: var(--text);
    margin-bottom: 20px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
  }
  .back-btn:hover { border-color: var(--accent); }
  .detail-hero {
    background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
    border: 1px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 20px;
  }
  .detail-hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .detail-title { font-size: 24px; font-weight: 700; }
  .detail-sub { font-size: 14px; color: var(--muted); margin-top: 4px; }
  .health-big { text-align: center; }
  .health-circle {
    width: 80px; height: 80px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    border: 4px solid; margin: 0 auto 6px;
  }
  .health-circle .pct { font-size: 20px; font-weight: 800; }
  .health-circle .lbl2 { font-size: 10px; color: var(--muted); }
  .health-text { font-size: 11px; color: var(--muted); }
  .detail-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .ds { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px; text-align: center; }
  .ds .dv { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .ds .dk { font-size: 11px; color: var(--muted); }

  .tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: var(--surface); border-radius: 12px; padding: 4px; border: 1px solid var(--border); }
  .tab-btn { flex: 1; padding: 8px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; transition: all 0.2s; background: transparent; color: var(--muted); }
  .tab-btn.active { background: var(--accent); color: white; }

  .maintenance-list { display: flex; flex-direction: column; gap: 10px; }
  .mitem {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 14px 16px; display: flex; align-items: center; gap: 14px;
  }
  .mitem-icon { font-size: 24px; width: 44px; height: 44px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mitem-info { flex: 1; }
  .mitem-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .mitem-detail { font-size: 12px; color: var(--muted); }
  .mitem-status { text-align: left; }
  .status-badge { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }

  .log-list { display: flex; flex-direction: column; gap: 10px; }
  .log-item {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
  }
  .log-left .log-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .log-left .log-meta { font-size: 12px; color: var(--muted); }
  .log-right { text-align: left; }
  .log-cost { font-size: 16px; font-weight: 700; color: var(--green); }
  .log-odo { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* ─── Stats Tab ─── */
  .stats-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
  .sc { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; text-align: center; }
  .sc .sv { font-size: 20px; font-weight: 700; color: var(--green); margin-bottom: 4px; }
  .sc .sk { font-size: 12px; color: var(--muted); }
  .bar-chart { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .bar-chart h3 { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: var(--muted); }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; }
  .bar-label { width: 100px; text-align: right; color: var(--muted); flex-shrink: 0; }
  .bar-track { flex: 1; background: var(--surface2); border-radius: 4px; height: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
  .bar-val { width: 60px; text-align: left; font-weight: 600; font-size: 12px; }

  .forecast-table { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .ft-row { display: flex; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; align-items: center; }
  .ft-row:last-child { border-bottom: none; }
  .ft-row.header { background: var(--surface2); font-size: 12px; color: var(--muted); font-weight: 600; }
  .ft-row > * { flex: 1; }
  .ft-row .cost { color: var(--yellow); font-weight: 600; text-align: left; }

  /* ─── Add Forms ─── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
    padding: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  }
  .modal h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; color: var(--muted); font-weight: 500; margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 14px; color: var(--text); font-family: inherit; font-size: 14px; direction: rtl;
    transition: border-color 0.2s;
  }
  .form-input:focus { outline: none; border-color: var(--accent); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .btn { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; transition: all 0.2s; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #2563EB; }
  .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--accent); }
  .btn-danger { background: var(--red); color: white; }
  .modal-footer { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-start; }

  .fab {
    position: fixed; bottom: 28px; left: 28px; z-index: 50;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; cursor: pointer; font-size: 24px; color: white;
    box-shadow: 0 4px 24px rgba(99,102,241,0.4); transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
  }
  .fab:hover { transform: scale(1.1); box-shadow: 0 6px 32px rgba(99,102,241,0.6); }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-emoji { font-size: 64px; margin-bottom: 16px; }
  .empty-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }

  .compare-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 12px; }
  .compare-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
  .compare-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
  .compare-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
  .compare-row .ck { color: var(--muted); }
  .compare-row .cv { font-weight: 600; }

  @media (max-width: 600px) {
    .stats-row, .detail-stats, .stats-cards { grid-template-columns: repeat(2,1fr); }
    .form-row { grid-template-columns: 1fr; }
    .vehicles-grid { grid-template-columns: 1fr; }
    .nav-tabs { gap: 2px; }
    .nav-tab { padding: 5px 10px; font-size: 12px; }
  }
`;

const MAINT_ICONS = {
  oil: "🛢️", filter: "🌀", tires: "🔄", battery: "🔋",
  insurance: "📋", inspection: "🔍", custom: "🔧", brake: "⛔", gearbox: "⚙️",
};

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("ar-BH", { year: "numeric", month: "short", day: "numeric" });
}

function totalCost(logs) {
  return logs.reduce((s, l) => s + (l.cost || 0), 0);
}

function thisYearCost(logs) {
  const y = new Date().getFullYear();
  return logs.filter(l => new Date(l.date).getFullYear() === y).reduce((s, l) => s + (l.cost || 0), 0);
}

function thisMonthCost(logs) {
  const now = new Date();
  return logs.filter(l => {
    const d = new Date(l.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s, l) => s + (l.cost || 0), 0);
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [page, setPage] = useState("dashboard"); // dashboard | vehicles | compare
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailTab, setDetailTab] = useState("maintenance");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showUpdateOdo, setShowUpdateOdo] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name:"", make:"", model:"", year:"", plate:"", color:"", purchaseDate:"", purchasePrice:"", odometer:"" });
  const [newLog, setNewLog] = useState({ service:"", date:"", odo:"", cost:"", workshop:"", notes:"" });
  const [newOdo, setNewOdo] = useState("");

  const sv = selectedVehicle ? vehicles.find(v => v.id === selectedVehicle) : null;

  // ─── Alerts ──────────────────────────────────────────────────
  const alerts = [];
  vehicles.forEach(v => {
    const estOdo = getEstimatedOdo(v);
    v.maintenance.forEach(m => {
      const s = getItemStatus(m, estOdo, v.dailyKmRate);
      if (s !== "ok") {
        const days = getItemDaysLeft(m, estOdo, v.dailyKmRate);
        alerts.push({ vehicleId: v.id, vehicleName: v.name, itemName: m.name, status: s, days });
      }
    });
  });
  alerts.sort((a, b) => a.days - b.days);

  function addVehicle() {
    if (!newVehicle.name || !newVehicle.odometer) return;
    const v = {
      id: Date.now(), ...newVehicle,
      odometer: parseInt(newVehicle.odometer) || 0,
      purchasePrice: parseFloat(newVehicle.purchasePrice) || 0,
      odometerUpdated: new Date().toISOString().split("T")[0],
      dailyKmRate: 20, image: null, maintenance: [], logs: [],
    };
    setVehicles(prev => [...prev, v]);
    setShowAddVehicle(false);
    setNewVehicle({ name:"", make:"", model:"", year:"", plate:"", color:"", purchaseDate:"", purchasePrice:"", odometer:"" });
  }

  function addLog() {
    if (!newLog.service || !newLog.date || !sv) return;
    setVehicles(prev => prev.map(v => v.id === sv.id ? {
      ...v,
      logs: [{ id: Date.now(), ...newLog, odo: parseInt(newLog.odo)||0, cost: parseFloat(newLog.cost)||0 }, ...v.logs],
    } : v));
    setShowAddLog(false);
    setNewLog({ service:"", date:"", odo:"", cost:"", workshop:"", notes:"" });
  }

  function updateOdometer() {
    const val = parseInt(newOdo);
    if (!val || !sv || val <= sv.odometer) return;
    const daysPassed = Math.max(1, Math.ceil((new Date() - new Date(sv.odometerUpdated)) / (1000*60*60*24)));
    const rate = Math.round((val - sv.odometer) / daysPassed);
    setVehicles(prev => prev.map(v => v.id === sv.id ? {
      ...v, odometer: val, odometerUpdated: new Date().toISOString().split("T")[0], dailyKmRate: rate,
    } : v));
    setShowUpdateOdo(false);
    setNewOdo("");
  }

  // ─── Dashboard ──────────────────────────────────────────────
  function Dashboard() {
    const overdue = vehicles.filter(v => {
      const e = getEstimatedOdo(v);
      return v.maintenance.some(m => getItemStatus(m, e, v.dailyKmRate) === "overdue");
    }).length;
    const upcoming = vehicles.filter(v => {
      const e = getEstimatedOdo(v);
      return v.maintenance.some(m => getItemStatus(m, e, v.dailyKmRate) === "upcoming") &&
             !v.maintenance.some(m => getItemStatus(m, e, v.dailyKmRate) === "overdue");
    }).length;

    return (
      <div className="page">
        <div className="stats-row">
          <div className="stat-card">
            <div className="num" style={{color:"#3B82F6"}}>{vehicles.length}</div>
            <div className="lbl">سياراتك</div>
          </div>
          <div className="stat-card">
            <div className="num" style={{color:"#EF4444"}}>{overdue}</div>
            <div className="lbl">تحتاج عناية فورية</div>
          </div>
          <div className="stat-card">
            <div className="num" style={{color:"#F59E0B"}}>{upcoming}</div>
            <div className="lbl">قادمة قريباً</div>
          </div>
        </div>

        {alerts.length > 0 && (
          <>
            <div className="section-title">⚠️ تنبيهات</div>
            <div className="alert-cards">
              {alerts.slice(0,5).map((a,i) => {
                const cfg = STATUS_CONFIG[a.status];
                const daysText = a.days < 0 ? `متأخر ${Math.abs(a.days)} يوم` :
                                 a.days === 0 ? "اليوم!" :
                                 `بعد ${a.days} يوم`;
                return (
                  <div key={i} className="alert-card" onClick={() => { setSelectedVehicle(a.vehicleId); setPage("detail"); }}>
                    <div className="alert-dot" style={{background: cfg.dot}} />
                    <div className="alert-info">
                      <div className="alert-car">{a.vehicleName}</div>
                      <div className="alert-detail">{a.itemName} — {daysText}</div>
                    </div>
                    <div className="alert-badge" style={{background: cfg.bg, color: cfg.text}}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="section-title">🚗 سياراتك</div>
        <div className="vehicles-grid">
          {vehicles.map(v => {
            const health = calcHealth(v);
            const hc = HEALTH_COLOR(health);
            const estOdo = getEstimatedOdo(v);
            const overdueCount = v.maintenance.filter(m => getItemStatus(m, estOdo, v.dailyKmRate) === "overdue").length;
            const upcomingCount = v.maintenance.filter(m => getItemStatus(m, estOdo, v.dailyKmRate) === "upcoming").length;
            const yearly = thisYearCost(v.logs);
            const emoji = CAR_EMOJIS[v.id % CAR_EMOJIS.length];
            return (
              <div key={v.id} className="vehicle-card" onClick={() => { setSelectedVehicle(v.id); setPage("detail"); setDetailTab("maintenance"); }}>
                <div className="vc-header">
                  <span className="vc-emoji">{emoji}</span>
                  <div className="vc-name">{v.name}</div>
                  <div className="vc-sub">{v.make} {v.model} — {v.year}</div>
                  <div className="vc-health">
                    <div className="vc-health-ring" style={{borderColor: hc, color: hc}}>{health}%</div>
                  </div>
                </div>
                <div className="vc-body">
                  <div className="vc-row"><span className="k">العداد (تقدير)</span><span className="v">{estOdo.toLocaleString("ar")} كم</span></div>
                  <div className="vc-row"><span className="k">اللوحة</span><span className="v">{v.plate}</span></div>
                  <div className="vc-row"><span className="k">مصروف هذه السنة</span><span className="v" style={{color:"#10B981"}}>{yearly} د.ب</span></div>
                </div>
                <div className="vc-footer">
                  {overdueCount > 0 && <span className="tag" style={{background:"#FEE2E2",color:"#991B1B"}}>⛔ {overdueCount} متأخرة</span>}
                  {upcomingCount > 0 && <span className="tag" style={{background:"#FEF3C7",color:"#92400E"}}>⚠️ {upcomingCount} قادمة</span>}
                  {overdueCount === 0 && upcomingCount === 0 && <span className="tag" style={{background:"#D1FAE5",color:"#065F46"}}>✅ ممتاز</span>}
                </div>
              </div>
            );
          })}
        </div>
        <button className="fab" onClick={() => setShowAddVehicle(true)}>+</button>
      </div>
    );
  }

  // ─── Vehicle Detail ──────────────────────────────────────────
  function VehicleDetail() {
    if (!sv) return null;
    const health = calcHealth(sv);
    const hc = HEALTH_COLOR(health);
    const estOdo = getEstimatedOdo(sv);
    const healthLabel = health >= 85 ? "ممتاز" : health >= 65 ? "يحتاج اهتمام" : "تحذير";

    // Forecast
    const forecast = sv.maintenance.filter(m => {
      const d = getItemDaysLeft(m, estOdo, sv.dailyKmRate);
      return d <= 90;
    }).map(m => ({ name: m.name, days: getItemDaysLeft(m, estOdo, sv.dailyKmRate), cost: m.cost || 0 }));
    const forecastTotal = forecast.reduce((s, f) => s + f.cost, 0);

    // Spending by category
    const byCategory = {};
    sv.logs.forEach(l => {
      byCategory[l.service] = (byCategory[l.service] || 0) + (l.cost || 0);
    });
    const cats = Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0,4);
    const maxCat = cats[0]?.[1] || 1;

    return (
      <div className="page">
        <button className="back-btn" onClick={() => { setSelectedVehicle(null); setPage("dashboard"); }}>
          ← رجوع
        </button>

        <div className="detail-hero">
          <div className="detail-hero-top">
            <div>
              <div className="detail-title">{sv.name}</div>
              <div className="detail-sub">{sv.make} {sv.model} {sv.year} • {sv.plate}</div>
            </div>
            <div className="health-big">
              <div className="health-circle" style={{borderColor: hc, color: hc}}>
                <span className="pct">{health}%</span>
              </div>
              <div className="health-text">صحة السيارة</div>
              <div style={{fontSize:11,fontWeight:600,color:hc,marginTop:2}}>{healthLabel}</div>
            </div>
          </div>
          <div className="detail-stats">
            <div className="ds">
              <div className="dv" style={{color:"#3B82F6"}}>{estOdo.toLocaleString("ar")}</div>
              <div className="dk">كم (تقدير)</div>
            </div>
            <div className="ds">
              <div className="dv" style={{color:"#10B981"}}>{thisYearCost(sv.logs)}</div>
              <div className="dk">د.ب هذه السنة</div>
            </div>
            <div className="ds">
              <div className="dv" style={{color:"#F59E0B"}}>{sv.logs.length}</div>
              <div className="dk">عملية صيانة</div>
            </div>
          </div>
          <div style={{marginTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={() => setShowAddLog(true)}>+ تسجيل صيانة</button>
            <button className="btn btn-secondary" onClick={() => setShowUpdateOdo(true)}>📍 تحديث العداد</button>
          </div>
        </div>

        <div className="tab-bar">
          {[["maintenance","🔧 الصيانة"],["logs","📋 السجل"],["stats","📊 الإحصائيات"]].map(([t,l]) => (
            <button key={t} className={`tab-btn ${detailTab===t?"active":""}`} onClick={() => setDetailTab(t)}>{l}</button>
          ))}
        </div>

        {detailTab === "maintenance" && (
          <div className="maintenance-list">
            {sv.maintenance.length === 0 && (
              <div className="empty-state">
                <div className="empty-emoji">🔧</div>
                <div className="empty-title">لا توجد عناصر صيانة</div>
                <div className="empty-sub">أضف أول عنصر صيانة لسيارتك</div>
              </div>
            )}
            {sv.maintenance.map(m => {
              const status = getItemStatus(m, estOdo, sv.dailyKmRate);
              const days = getItemDaysLeft(m, estOdo, sv.dailyKmRate);
              const cfg = STATUS_CONFIG[status];
              const icon = MAINT_ICONS[m.category] || "🔧";
              const daysText = days < 0 ? `متأخر ${Math.abs(days)} يوم` :
                               days === 0 ? "اليوم!" :
                               days > 365 ? `بعد ${Math.round(days/30)} شهر` :
                               `بعد ${days} يوم`;
              return (
                <div key={m.id} className="mitem">
                  <div className="mitem-icon">{icon}</div>
                  <div className="mitem-info">
                    <div className="mitem-name">{m.name}</div>
                    <div className="mitem-detail">
                      {m.lastDate ? `آخر: ${formatDate(m.lastDate)}` : "لم يُجرَ بعد"}
                      {m.dueDate && ` • القادم: ${formatDate(m.dueDate)}`}
                    </div>
                  </div>
                  <div className="mitem-status">
                    <div className="status-badge" style={{background: cfg.bg, color: cfg.text}}>{cfg.label}</div>
                    <div style={{fontSize:11,color:cfg.text,marginTop:4,textAlign:"left"}}>{daysText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {detailTab === "logs" && (
          <div className="log-list">
            {sv.logs.length === 0 && (
              <div className="empty-state">
                <div className="empty-emoji">📋</div>
                <div className="empty-title">لا يوجد سجل بعد</div>
                <div className="empty-sub">سجّل أول عملية صيانة</div>
                <button className="btn btn-primary" onClick={() => setShowAddLog(true)}>+ تسجيل صيانة</button>
              </div>
            )}
            {sv.logs.map(l => (
              <div key={l.id} className="log-item">
                <div className="log-left">
                  <div className="log-name">{l.service}</div>
                  <div className="log-meta">{formatDate(l.date)}{l.workshop ? ` • ${l.workshop}` : ""}</div>
                  {l.notes && <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>{l.notes}</div>}
                </div>
                <div className="log-right">
                  <div className="log-cost">{l.cost > 0 ? `${l.cost} د.ب` : "—"}</div>
                  <div className="log-odo">{l.odo ? `${l.odo.toLocaleString("ar")} كم` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {detailTab === "stats" && (
          <div>
            <div className="stats-cards">
              <div className="sc"><div className="sv">{thisMonthCost(sv.logs)}</div><div className="sk">د.ب هذا الشهر</div></div>
              <div className="sc"><div className="sv">{thisYearCost(sv.logs)}</div><div className="sk">د.ب هذه السنة</div></div>
              <div className="sc"><div className="sv">{totalCost(sv.logs)}</div><div className="sk">د.ب إجمالي</div></div>
            </div>

            {cats.length > 0 && (
              <div className="bar-chart">
                <h3>توزيع المصروفات</h3>
                {cats.map(([name, val]) => (
                  <div key={name} className="bar-row">
                    <div className="bar-label">{name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width:`${(val/maxCat)*100}%`, background:"linear-gradient(90deg,#3B82F6,#6366F1)"}} />
                    </div>
                    <div className="bar-val" style={{color:"#3B82F6"}}>{val} د.ب</div>
                  </div>
                ))}
              </div>
            )}

            {forecast.length > 0 && (
              <>
                <div className="section-title" style={{marginBottom:12}}>💡 التكاليف المتوقعة خلال ٣ أشهر</div>
                <div className="forecast-table">
                  <div className="ft-row header">
                    <span>البند</span><span>الموعد</span><span className="cost">التكلفة المتوقعة</span>
                  </div>
                  {forecast.map((f,i) => (
                    <div key={i} className="ft-row">
                      <span>{f.name}</span>
                      <span style={{color:"#94A3B8",fontSize:12}}>
                        {f.days < 0 ? "متأخر" : f.days === 0 ? "اليوم" : `${f.days} يوم`}
                      </span>
                      <span className="cost">{f.cost > 0 ? `${f.cost} د.ب` : "—"}</span>
                    </div>
                  ))}
                  {forecastTotal > 0 && (
                    <div className="ft-row" style={{background:"rgba(59,130,246,0.1)",fontWeight:700}}>
                      <span>الإجمالي المتوقع</span><span></span>
                      <span className="cost" style={{color:"#3B82F6"}}>{forecastTotal} د.ب</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Compare ────────────────────────────────────────────────
  function Compare() {
    if (vehicles.length < 2) return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-emoji">📊</div>
          <div className="empty-title">أضف سيارتين على الأقل</div>
          <div className="empty-sub">المقارنة تحتاج سيارتين أو أكثر</div>
          <button className="btn btn-primary" onClick={() => setShowAddVehicle(true)}>+ إضافة سيارة</button>
        </div>
      </div>
    );

    const sorted = [...vehicles].sort((a,b) => totalCost(b.logs) - totalCost(a.logs));

    return (
      <div className="page">
        <div className="section-title">📊 مقارنة السيارات</div>
        <div className="compare-grid">
          {sorted.map((v,i) => {
            const health = calcHealth(v);
            const hc = HEALTH_COLOR(health);
            const estOdo = getEstimatedOdo(v);
            const overdueCount = v.maintenance.filter(m => getItemStatus(m, estOdo, v.dailyKmRate) === "overdue").length;
            return (
              <div key={v.id} className="compare-card" style={i===0?{borderColor:"#F59E0B"}:{}}>
                {i===0 && <div style={{fontSize:11,color:"#F59E0B",fontWeight:600,marginBottom:8}}>🏆 الأعلى إنفاقاً</div>}
                <h4>{v.name}</h4>
                <div className="compare-row"><span className="ck">صحة السيارة</span><span className="cv" style={{color:hc}}>{health}%</span></div>
                <div className="compare-row"><span className="ck">العداد (تقدير)</span><span className="cv">{estOdo.toLocaleString("ar")} كم</span></div>
                <div className="compare-row"><span className="ck">إجمالي المصروف</span><span className="cv" style={{color:"#10B981"}}>{totalCost(v.logs)} د.ب</span></div>
                <div className="compare-row"><span className="ck">عمليات الصيانة</span><span className="cv">{v.logs.length}</span></div>
                <div className="compare-row"><span className="ck">متأخرة</span><span className="cv" style={{color: overdueCount>0?"#EF4444":"#10B981"}}>{overdueCount > 0 ? `${overdueCount} ⛔` : "لا يوجد ✅"}</span></div>
                <div className="compare-row"><span className="ck">مصروف السنة</span><span className="cv">{thisYearCost(v.logs)} د.ب</span></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Modals ──────────────────────────────────────────────────
  function AddVehicleModal() {
    return (
      <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddVehicle(false)}>
        <div className="modal">
          <h2>🚗 إضافة سيارة جديدة</h2>
          <div className="form-group">
            <label className="form-label">الاسم المخصص *</label>
            <input className="form-input" placeholder="مثال: لاندكروزر الأبيض" value={newVehicle.name} onChange={e => setNewVehicle(p=>({...p,name:e.target.value}))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الشركة المصنعة</label>
              <input className="form-input" placeholder="Toyota" value={newVehicle.make} onChange={e => setNewVehicle(p=>({...p,make:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">الموديل</label>
              <input className="form-input" placeholder="Land Cruiser" value={newVehicle.model} onChange={e => setNewVehicle(p=>({...p,model:e.target.value}))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">سنة الصنع</label>
              <input className="form-input" placeholder="2022" type="number" value={newVehicle.year} onChange={e => setNewVehicle(p=>({...p,year:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم اللوحة</label>
              <input className="form-input" placeholder="١٢٣٤ بح" value={newVehicle.plate} onChange={e => setNewVehicle(p=>({...p,plate:e.target.value}))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">اللون</label>
              <input className="form-input" placeholder="أبيض" value={newVehicle.color} onChange={e => setNewVehicle(p=>({...p,color:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">سعر الشراء (د.ب)</label>
              <input className="form-input" placeholder="12000" type="number" value={newVehicle.purchasePrice} onChange={e => setNewVehicle(p=>({...p,purchasePrice:e.target.value}))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">تاريخ الشراء</label>
              <input className="form-input" type="date" value={newVehicle.purchaseDate} onChange={e => setNewVehicle(p=>({...p,purchaseDate:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">قراءة العداد الحالية (كم) *</label>
              <input className="form-input" placeholder="45000" type="number" value={newVehicle.odometer} onChange={e => setNewVehicle(p=>({...p,odometer:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={addVehicle}>إضافة السيارة</button>
            <button className="btn btn-secondary" onClick={() => setShowAddVehicle(false)}>إلغاء</button>
          </div>
        </div>
      </div>
    );
  }

  function AddLogModal() {
    return (
      <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddLog(false)}>
        <div className="modal">
          <h2>🔧 تسجيل صيانة</h2>
          <div className="form-group">
            <label className="form-label">نوع العمل *</label>
            <input className="form-input" placeholder="مثال: تغيير زيت" value={newLog.service} onChange={e => setNewLog(p=>({...p,service:e.target.value}))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">التاريخ *</label>
              <input className="form-input" type="date" value={newLog.date} onChange={e => setNewLog(p=>({...p,date:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">قراءة العداد (كم)</label>
              <input className="form-input" placeholder="87500" type="number" value={newLog.odo} onChange={e => setNewLog(p=>({...p,odo:e.target.value}))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">التكلفة (د.ب)</label>
              <input className="form-input" placeholder="25" type="number" value={newLog.cost} onChange={e => setNewLog(p=>({...p,cost:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">الورشة</label>
              <input className="form-input" placeholder="اسم الورشة" value={newLog.workshop} onChange={e => setNewLog(p=>({...p,workshop:e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">ملاحظات</label>
            <input className="form-input" placeholder="أي تفاصيل إضافية..." value={newLog.notes} onChange={e => setNewLog(p=>({...p,notes:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={addLog}>حفظ</button>
            <button className="btn btn-secondary" onClick={() => setShowAddLog(false)}>إلغاء</button>
          </div>
        </div>
      </div>
    );
  }

  function UpdateOdoModal() {
    return (
      <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowUpdateOdo(false)}>
        <div className="modal">
          <h2>📍 تحديث العداد</h2>
          <div style={{background:"#1E293B",borderRadius:12,padding:14,marginBottom:16,fontSize:13,color:"#94A3B8"}}>
            القراءة الحالية المسجّلة: <strong style={{color:"#F1F5F9"}}>{sv?.odometer.toLocaleString("ar")} كم</strong>
            <br/>التقدير اليوم: <strong style={{color:"#3B82F6"}}>{sv ? getEstimatedOdo(sv).toLocaleString("ar") : ""} كم</strong>
          </div>
          <div className="form-group">
            <label className="form-label">القراءة الجديدة (كم)</label>
            <input className="form-input" placeholder="أدخل القراءة الحالية" type="number" value={newOdo} onChange={e => setNewOdo(e.target.value)} autoFocus />
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={updateOdometer}>تحديث</button>
            <button className="btn btn-secondary" onClick={() => setShowUpdateOdo(false)}>إلغاء</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">🚗 سيارتي</div>
          <div className="nav-tabs">
            <button className={`nav-tab ${page==="dashboard"||page==="detail"?"active":""}`} onClick={() => { setPage("dashboard"); setSelectedVehicle(null); }}>الرئيسية</button>
            <button className={`nav-tab ${page==="compare"?"active":""}`} onClick={() => setPage("compare")}>المقارنة</button>
          </div>
        </nav>

        {(page === "dashboard") && <Dashboard />}
        {(page === "detail") && <VehicleDetail />}
        {(page === "compare") && <Compare />}

        {page === "dashboard" && !selectedVehicle && (
          <button className="fab" onClick={() => setShowAddVehicle(true)}>+</button>
        )}

        {showAddVehicle && <AddVehicleModal />}
        {showAddLog && sv && <AddLogModal />}
        {showUpdateOdo && sv && <UpdateOdoModal />}
      </div>
    </>
  );
}

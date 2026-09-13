// ---------------------------------------------------------------------------
// Airport Operations dashboard — all data below is simulated for the demo.
// Nothing here reads real airport telemetry; it exists to show what an
// IoT + AI-driven ops view of the proposed framework would look like.
// ---------------------------------------------------------------------------

const palette = {
  accent: "#22d3ee",
  accent2: "#7c9cff",
  track: "#182238",
  good: "#34d399",
  warn: "#f7b955",
  crit: "#f87171",
  muted: "#8ea3ba",
};

Chart.defaults.color = palette.muted;
Chart.defaults.font.family = "-apple-system, Segoe UI, sans-serif";

// ---------------- Terminal occupancy gauge ----------------
let occupancy = 58;
const gaugeCtx = document.getElementById("gaugeChart").getContext("2d");
const gaugeChart = new Chart(gaugeCtx, {
  type: "doughnut",
  data: {
    datasets: [{ data: [occupancy, 100 - occupancy], backgroundColor: [palette.accent, palette.track], borderWidth: 0 }],
  },
  options: {
    circumference: 180,
    rotation: 270,
    cutout: "78%",
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { duration: 500 },
  },
});
document.getElementById("gaugeNum").textContent = occupancy + "%";

function tickOccupancy() {
  occupancy = Math.max(30, Math.min(96, occupancy + (Math.random() * 14 - 7)));
  const v = Math.round(occupancy);
  gaugeChart.data.datasets[0].data = [v, 100 - v];
  gaugeChart.update();
  document.getElementById("gaugeNum").textContent = v + "%";
}
setInterval(tickOccupancy, 3000);

// ---------------- Energy usage chart ----------------
const energyLabels = [];
const energyData = [];
let baseLoad = 210;
const now0 = Date.now();
for (let i = 19; i >= 0; i--) {
  const t = new Date(now0 - i * 60000);
  energyLabels.push(t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
  baseLoad += Math.random() * 10 - 5;
  energyData.push(Math.round(baseLoad));
}
const energyCtx = document.getElementById("energyChart").getContext("2d");
const energyChart = new Chart(energyCtx, {
  type: "line",
  data: {
    labels: energyLabels,
    datasets: [{
      data: energyData,
      borderColor: palette.accent2,
      backgroundColor: "rgba(124,156,255,.12)",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.35,
      fill: true,
    }],
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 5, font: { size: 10 } } },
      y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { font: { size: 10 } }, title: { display: true, text: "kWh", color: palette.muted, font: { size: 10 } } },
    },
    animation: { duration: 400 },
  },
});
function tickEnergy() {
  baseLoad += Math.random() * 10 - 5;
  energyData.shift();
  energyData.push(Math.round(baseLoad));
  energyLabels.shift();
  energyLabels.push(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
  energyChart.update();
}
setInterval(tickEnergy, 4000);

// ---------------- Predictive maintenance ----------------
const equipment = [
  { name: "Baggage Belt 2", status: "good", msg: "Nominal · last serviced 12 days ago" },
  { name: "Aerobridge 1", status: "good", msg: "Nominal · cycle count within range" },
  { name: "HVAC Unit 3 — Terminal", status: "good", msg: "Nominal · compressor load steady" },
  { name: "Runway Edge Lighting", status: "good", msg: "Nominal · all fixtures reporting" },
];
const alertsEl = document.getElementById("alerts");
function iconFor(status) {
  return { good: "✓", warn: "⚠", crit: "✕" }[status];
}
function renderAlerts() {
  alertsEl.innerHTML = equipment.map((e) => `
    <div class="alert-item" data-name="${e.name}">
      <div class="ic" style="background:${palette[e.status]}22; color:${palette[e.status]};">${iconFor(e.status)}</div>
      <div class="body"><div class="name">${e.name}</div><div class="msg">${e.msg}</div></div>
    </div>`).join("");
}
renderAlerts();

// After a short delay, simulate the AI predictive-maintenance model flagging
// a real risk — this is the moment that demonstrates "predictive", not just "monitoring".
setTimeout(() => {
  const target = equipment[2];
  target.status = "warn";
  target.msg = "AI model: 78% probability of compressor fault within 48h — schedule inspection";
  renderAlerts();
  const item = alertsEl.querySelector(`[data-name="${CSS.escape(target.name)}"]`);
  if (item) { item.classList.add("flash"); setTimeout(() => item.classList.remove("flash"), 2500); }
}, 9000);

// ---------------- Flight board ----------------
const flights = [
  { no: "6E-2201", route: "THJ → MAA", time: "10:20", gate: "1", status: "good", label: "On Time" },
  { no: "IX-4417", route: "THJ → BLR", time: "11:05", gate: "2", status: "info", label: "Boarding" },
  { no: "QP-1188", route: "THJ → TRZ", time: "12:40", gate: "1", status: "good", label: "On Time" },
  { no: "6E-2255", route: "MAA → THJ", time: "13:15", gate: "A1", status: "good", label: "Scheduled" },
];
const flightRows = document.getElementById("flightRows");
function pillClass(s) { return { good: "good", warn: "warn", crit: "crit", info: "info" }[s]; }
function renderFlights() {
  flightRows.innerHTML = flights.map((f) => `
    <tr>
      <td>${f.no}</td><td>${f.route}</td><td>${f.time}</td><td>${f.gate}</td>
      <td><span class="pill ${pillClass(f.status)}">${f.label}</span></td>
    </tr>`).join("");
}
renderFlights();
setTimeout(() => {
  flights[0].status = "warn";
  flights[0].label = "Delayed 10m";
  renderFlights();
}, 13000);

// ---------------- Smart cargo & cold-chain tracking ----------------
const STAGES = ["Received", "Cold Storage", "Customs", "Loaded", "Departed"];
const cargo = [
  { id: "RFID-88213", desc: "Cauvery Delta Rice — Export Lot", stage: 1 },
  { id: "RFID-88214", desc: "Perishable — Mango Consignment", stage: 2 },
  { id: "RFID-88220", desc: "Pharma — Cold Chain", stage: 0 },
];
const cargoList = document.getElementById("cargoList");
function renderCargo() {
  cargoList.innerHTML = cargo.map((c) => {
    const pct = (c.stage / (STAGES.length - 1)) * 100;
    return `
    <div class="cargo-item">
      <div class="cargo-top"><span>${c.desc}</span><span class="id">${c.id}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="stage-labels">${STAGES.map((s, i) => `<span style="color:${i <= c.stage ? "#22d3ee" : "inherit"}">${s}</span>`).join("")}</div>
    </div>`;
  }).join("");
}
renderCargo();
setInterval(() => {
  const c = cargo[Math.floor(Math.random() * cargo.length)];
  if (c.stage < STAGES.length - 1) c.stage++;
  renderCargo();
}, 5000);

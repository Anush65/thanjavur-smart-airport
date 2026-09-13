// Deterministic "lookup" so ANY booking reference typed during the demo
// produces a plausible, stable flight — nothing can 404 on stage.

const ROUTES = [
  { code: "6E-2201", to: "MAA", city: "Chennai", aircraft: "ATR 72 · 70 seats" },
  { code: "IX-4417", to: "BLR", city: "Bengaluru", aircraft: "ATR 72 · 70 seats" },
  { code: "QP-1188", to: "TRZ", city: "Tiruchirappalli", aircraft: "ATR 72 · 70 seats" },
  { code: "6E-2255", to: "MAA", city: "Chennai", aircraft: "ATR 72 · 70 seats" },
];
const GATES = ["1", "2", "A1"];
const ROWS = "ABCDEF";

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildFlight(pnrRaw) {
  const pnr = (pnrRaw || "").trim().toUpperCase() || "THJGUEST";
  const h = hashStr(pnr);
  const route = ROUTES[h % ROUTES.length];
  const gate = GATES[h % GATES.length];
  const seatRow = 3 + (h % 15);
  const seatLetter = ROWS[(h >> 3) % ROWS.length];
  const now = new Date();
  const dep = new Date(now.getTime() + ((h % 5) + 2) * 3600 * 1000);
  const boardTime = new Date(dep.getTime() - 30 * 60 * 1000);
  return {
    pnr,
    flightNo: route.code,
    from: "THJ", fromCity: "Thanjavur",
    to: route.to, toCity: route.city,
    aircraft: route.aircraft,
    gate,
    seat: `${seatRow}${seatLetter}`,
    date: dep.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    depTime: dep.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    boardTime: boardTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function renderBoardingPass(f) {
  const result = document.getElementById("result");
  result.innerHTML = `
    <div class="boarding-pass">
      <div class="bp-main">
        <div class="bp-route">
          <div><div class="code">${f.from}</div><div class="city">${f.fromCity}</div></div>
          <div class="arrow">✈ →</div>
          <div><div class="code">${f.to}</div><div class="city">${f.toCity}</div></div>
        </div>
        <div class="bp-grid">
          <div><div class="k">Flight</div><div class="v">${f.flightNo}</div></div>
          <div><div class="k">Date</div><div class="v">${f.date}</div></div>
          <div><div class="k">Gate</div><div class="v">${f.gate}</div></div>
          <div><div class="k">Seat</div><div class="v">${f.seat}</div></div>
          <div><div class="k">Boarding</div><div class="v">${f.boardTime}</div></div>
          <div><div class="k">Departure</div><div class="v">${f.depTime}</div></div>
          <div><div class="k">Aircraft</div><div class="v" style="font-size:12.5px;">${f.aircraft}</div></div>
          <div><div class="k">Class</div><div class="v">Economy</div></div>
        </div>

        <div class="timeline">
          <h3>Live Journey Status (IoT-tracked)</h3>
          <div class="steps" id="steps">
            ${["Checked In", "Security", "Lounge", "Gate", "Boarding"].map((l, i) =>
              `<div class="step" data-i="${i}"><div class="bubble">${i === 0 ? "✓" : i + 1}</div><div class="lbl">${l}</div></div>`
            ).join("")}
          </div>
        </div>
        <div class="note">This QR is the passenger's only credential — presented at security, lounge access and the gate,
          each scan updating the journey status above in real time.</div>
      </div>
      <div class="bp-side">
        <div id="qrcode"></div>
        <div class="pnr">PNR ${f.pnr}</div>
        <div class="smart-tag">Smart QR · No Paper Ticket</div>
      </div>
    </div>
  `;

  const qr = qrcode(0, "M");
  qr.addData(`THANJAVUR-SMART-AIRPORT|PNR:${f.pnr}|FLT:${f.flightNo}|${f.from}-${f.to}|SEAT:${f.seat}|GATE:${f.gate}|DATE:${f.date}`);
  qr.make();
  document.getElementById("qrcode").innerHTML = qr.createSvgTag(4, 4);

  // Animate the journey timeline forward, as if IoT gate-scans are arriving live.
  let step = 0;
  const steps = document.querySelectorAll("#steps .step");
  steps[0].classList.add("done");
  steps[1] && steps[1].classList.add("active");
  step = 1;
  clearInterval(renderBoardingPass._t);
  renderBoardingPass._t = setInterval(() => {
    if (step >= steps.length - 1) { clearInterval(renderBoardingPass._t); return; }
    steps[step].classList.remove("active");
    steps[step].classList.add("done");
    steps[step].querySelector(".bubble").textContent = "✓";
    step++;
    steps[step].classList.add("active");
  }, 3200);
}

function runLookup() {
  const pnr = document.getElementById("pnrInput").value;
  renderBoardingPass(buildFlight(pnr));
}

document.getElementById("lookupBtn").addEventListener("click", runLookup);
document.getElementById("pnrInput").addEventListener("keydown", (e) => { if (e.key === "Enter") runLookup(); });
document.querySelectorAll(".demo-codes button").forEach((b) => {
  b.addEventListener("click", () => {
    document.getElementById("pnrInput").value = b.dataset.pnr;
    runLookup();
  });
});

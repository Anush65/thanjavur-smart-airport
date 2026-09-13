// ---------------------------------------------------------------------------
// Thanjavur Smart Airport — Digital Twin scene
// Built on CesiumJS, using only token-free data sources (OpenStreetMap
// imagery, ellipsoid terrain) so it runs with zero API keys / accounts.
// ---------------------------------------------------------------------------

const loadingEl = document.getElementById("loading");

const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  shouldAnimate: true,
  terrainProvider: new Cesium.EllipsoidTerrainProvider(),
});

viewer.imageryLayers.addImageryProvider(
  new Cesium.OpenStreetMapImageryProvider({
    url: "https://a.tile.openstreetmap.org/",
    credit: "© OpenStreetMap contributors",
  })
);

viewer.scene.globe.enableLighting = false;
viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
viewer.scene.skyAtmosphere.hueShift = -0.02;
viewer.scene.fog.enabled = true;
viewer.clock.shouldAnimate = true;
viewer.scene.requestRenderMode = true;
viewer.scene.maximumRenderTimeChange = Infinity;

function hideLoading() {
  if (!loadingEl || loadingEl.dataset.hidden) return;
  loadingEl.dataset.hidden = "1";
  loadingEl.style.opacity = "0";
  setTimeout(() => (loadingEl.style.display = "none"), 350);
}
// Hide synchronously (no event-loop yield) rather than waiting on tile
// loads: some environments (older GPUs / software rendering) don't
// recomposite a WebGL canvas correctly if it sits behind an opaque
// overlay across even one extra paint.
hideLoading();

// ---------------------------------------------------------------------------
// Data sources (so we can group + toggle)
// ---------------------------------------------------------------------------
const siteDS = new Cesium.CustomDataSource("site");
const labelsDS = new Cesium.CustomDataSource("labels");
const routesDS = new Cesium.CustomDataSource("routes");
viewer.dataSources.add(siteDS);
viewer.dataSources.add(labelsDS);
viewer.dataSources.add(routesDS);

const COLORS = {
  runway: Cesium.Color.fromCssColorString("#5b6b7d"),
  terminal: Cesium.Color.fromCssColorString("#22d3ee"),
  tower: Cesium.Color.fromCssColorString("#7c9cff"),
  cargo: Cesium.Color.fromCssColorString("#f7b955"),
  solar: Cesium.Color.fromCssColorString("#34d399"),
  transport: Cesium.Color.fromCssColorString("#f472b6"),
};

function labelStyle(text, extra) {
  return Object.assign(
    {
      text,
      font: "600 14px -apple-system, Segoe UI, sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.fromCssColorString("#050810"),
      outlineWidth: 4,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10),
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#0a0f1a").withAlpha(0.72),
      backgroundPadding: new Cesium.Cartesian2(6, 4),
      scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 8000, 0.4),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    extra || {}
  );
}

// ---------------------------------------------------------------------------
// Airport site — simplified massing model at the real coordinates
// ---------------------------------------------------------------------------
const A = SITE.thanjavurAirport;
const heading = SITE.runwayHeadingDeg;

// Runway
const runwayCorners = rectFootprint(A, heading, SITE.runwayLengthM, SITE.runwayWidthM);
siteDS.entities.add({
  name: "Runway",
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray(footprintToDegreesArray(runwayCorners)),
    material: COLORS.runway.withAlpha(0.95),
    height: 0,
    outline: true,
    outlineColor: Cesium.Color.BLACK.withAlpha(0.4),
  },
});
// Centerline stripe for a touch of realism
const centerlinePts = [];
for (let t = -0.42; t <= 0.42; t += 0.06) {
  const p = destinationPoint(A.lat, A.lon, heading, t * SITE.runwayLengthM);
  centerlinePts.push(p.lon, p.lat);
}
siteDS.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray(centerlinePts),
    width: 2,
    material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.WHITE.withAlpha(0.85), dashLength: 14 }),
    clampToGround: false,
  },
});

// Apron (near one end of the runway, offset to the side where the terminal sits)
const apronCenter = destinationPoint(
  destinationPoint(A.lat, A.lon, heading, SITE.runwayLengthM * 0.28).lat,
  destinationPoint(A.lat, A.lon, heading, SITE.runwayLengthM * 0.28).lon,
  heading + 90,
  140
);
const apronCorners = rectFootprint(apronCenter, heading, 260, 160);
siteDS.entities.add({
  name: "Apron",
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray(footprintToDegreesArray(apronCorners)),
    material: Cesium.Color.fromCssColorString("#42506080"),
    height: 0.6,
  },
});

function addBuilding(ds, center, headingDeg, widthM, lengthM, heightM, color, name, labelText) {
  const pos = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, heightM / 2);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    pos,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(headingDeg), 0, 0)
  );
  ds.entities.add({
    name,
    position: pos,
    orientation,
    box: {
      dimensions: new Cesium.Cartesian3(widthM, lengthM, heightM),
      material: color.withAlpha(0.9),
      outline: true,
      outlineColor: Cesium.Color.BLACK.withAlpha(0.35),
    },
  });
  if (labelText) {
    labelsDS.entities.add({
      position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, heightM),
      label: labelStyle(labelText),
    });
  }
}

// Terminal — offset further along the apron side
const terminalCenter = destinationPoint(apronCenter.lat, apronCenter.lon, heading + 90, 170);
addBuilding(siteDS, terminalCenter, heading, 42, 190, 14, COLORS.terminal, "Terminal", "Smart Passenger Terminal");

// Control tower — beside the terminal
const towerCenter = destinationPoint(terminalCenter.lat, terminalCenter.lon, heading, 130);
addBuilding(siteDS, towerCenter, heading, 16, 16, 38, COLORS.tower, "Control Tower", "Control Tower · AI-Powered Ops");

// Cargo & cold-chain hub — far end of the runway
const cargoBase = destinationPoint(A.lat, A.lon, heading, -SITE.runwayLengthM * 0.32);
const cargoCenter = destinationPoint(cargoBase.lat, cargoBase.lon, heading + 90, 160);
addBuilding(siteDS, cargoCenter, heading, 34, 120, 11, COLORS.cargo, "Cargo Hub", "Smart Cargo & Cold-Chain Hub");

// Solar micro-grid zone — open land behind the cargo hub
const solarCenter = destinationPoint(cargoCenter.lat, cargoCenter.lon, heading + 90, 130);
const solarCorners = rectFootprint(solarCenter, heading, 150, 110);
siteDS.entities.add({
  name: "Solar Zone",
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray(footprintToDegreesArray(solarCorners)),
    material: COLORS.solar.withAlpha(0.55),
    height: 0.4,
    outline: true,
    outlineColor: COLORS.solar,
  },
});
labelsDS.entities.add({
  position: Cesium.Cartesian3.fromDegrees(solarCenter.lon, solarCenter.lat, 6),
  label: labelStyle("Solar Micro-grid (Vision 2035)"),
});

// Multimodal transport hub — landside, in front of the terminal
const transportCenter = destinationPoint(terminalCenter.lat, terminalCenter.lon, heading - 90, 110);
addBuilding(siteDS, transportCenter, heading, 60, 60, 6, COLORS.transport, "Transport Hub", "Multimodal Transport Hub");

// Approach road stub toward NH-36
const roadStub = destinationPoint(transportCenter.lat, transportCenter.lon, heading - 90, 400);
siteDS.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([
      transportCenter.lon, transportCenter.lat,
      roadStub.lon, roadStub.lat,
    ]),
    width: 4,
    material: Cesium.Color.fromCssColorString("#cbd5e1").withAlpha(0.7),
    clampToGround: false,
  },
});
labelsDS.entities.add({
  position: Cesium.Cartesian3.fromDegrees(roadStub.lon, roadStub.lat, 3),
  label: labelStyle("Approach Road → NH-36"),
});

// ---------------------------------------------------------------------------
// Regional connectivity — Thanjavur ↔ Trichy, and the temple
// ---------------------------------------------------------------------------
const pinBuilder = new Cesium.PinBuilder();

function addPlacemark(ds, point, color, iconLabel) {
  ds.entities.add({
    position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, 0),
    billboard: {
      image: pinBuilder.fromText(iconLabel, Cesium.Color.fromCssColorString(color), 42).toDataURL(),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: labelStyle(point.label, { pixelOffset: new Cesium.Cartesian2(0, -46) }),
  });
}

addPlacemark(routesDS, SITE.thanjavurAirport, "#22d3ee", "T");
addPlacemark(routesDS, SITE.trichyAirport, "#f472b6", "X");
addPlacemark(routesDS, SITE.temple, "#f7b955", "★");

// Flight arc Thanjavur -> Trichy (parabolic altitude profile)
const flightDistanceM = haversineDistance(SITE.thanjavurAirport, SITE.trichyAirport);
const N = 60;
const cruiseAlt = 3200;
const flightPositions = [];
for (let i = 0; i <= N; i++) {
  const f = i / N;
  const lat = SITE.thanjavurAirport.lat + (SITE.trichyAirport.lat - SITE.thanjavurAirport.lat) * f;
  const lon = SITE.thanjavurAirport.lon + (SITE.trichyAirport.lon - SITE.thanjavurAirport.lon) * f;
  const alt = Math.sin(f * Math.PI) * cruiseAlt;
  flightPositions.push(lon, lat, alt);
}
routesDS.entities.add({
  name: "Flight path",
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArrayHeights(flightPositions),
    width: 3,
    arcType: Cesium.ArcType.NONE,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.25,
      color: Cesium.Color.fromCssColorString("#22d3ee"),
    }),
  },
});

// Indicative road route (Thanjavur -> Trichy), with a couple of jog points
// so it doesn't look identical to the flight path. Not turn-by-turn accurate.
const mid1 = destinationPoint(SITE.thanjavurAirport.lat, SITE.thanjavurAirport.lon, 255, flightDistanceM * 0.35);
const mid2 = destinationPoint(SITE.trichyAirport.lat, SITE.trichyAirport.lon, 95, flightDistanceM * 0.4);
routesDS.entities.add({
  name: "Road route",
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([
      SITE.thanjavurAirport.lon, SITE.thanjavurAirport.lat,
      mid1.lon, mid1.lat,
      mid2.lon, mid2.lat,
      SITE.trichyAirport.lon, SITE.trichyAirport.lat,
    ]),
    width: 3,
    clampToGround: true,
    material: new Cesium.PolylineDashMaterialProperty({
      color: Cesium.Color.fromCssColorString("#f87171"),
      dashLength: 10,
    }),
  },
});

// Animated plane traveling the flight arc, looping
const planeEntity = routesDS.entities.add({
  name: "Flight demo",
  position: new Cesium.CallbackProperty(function () {
    const t = (performance.now() % 9000) / 9000;
    const idx = Math.min(N, Math.floor(t * N));
    const nextIdx = Math.min(N, idx + 1);
    const p0 = flightPositions.slice(idx * 3, idx * 3 + 3);
    const p1 = flightPositions.slice(nextIdx * 3, nextIdx * 3 + 3);
    const localF = t * N - idx;
    const lon = p0[0] + (p1[0] - p0[0]) * localF;
    const lat = p0[1] + (p1[1] - p0[1]) * localF;
    const h = p0[2] + (p1[2] - p0[2]) * localF;
    return Cesium.Cartesian3.fromDegrees(lon, lat, h);
  }, false),
  point: { pixelSize: 10, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString("#22d3ee"), outlineWidth: 3 },
});

// Distance / time readout near the midpoint
const midPoint = destinationPoint(SITE.thanjavurAirport.lat, SITE.thanjavurAirport.lon, /*bearing to trichy*/ (function(){
  const y = Math.sin(toRad(SITE.trichyAirport.lon - SITE.thanjavurAirport.lon)) * Math.cos(toRad(SITE.trichyAirport.lat));
  const x = Math.cos(toRad(SITE.thanjavurAirport.lat)) * Math.sin(toRad(SITE.trichyAirport.lat)) -
            Math.sin(toRad(SITE.thanjavurAirport.lat)) * Math.cos(toRad(SITE.trichyAirport.lat)) * Math.cos(toRad(SITE.trichyAirport.lon - SITE.thanjavurAirport.lon));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
})(), flightDistanceM / 2);

const flightKm = (flightDistanceM / 1000).toFixed(0);
const estFlightMin = Math.round((flightDistanceM / 1000 / 400) * 60 + 20); // cruise ~400km/h + ~20min ground ops
routesDS.entities.add({
  position: Cesium.Cartesian3.fromDegrees(midPoint.lon, midPoint.lat, cruiseAlt * 0.75),
  label: labelStyle(`✈ ~${flightKm} km · ~${estFlightMin} min gate-to-gate  |  🚗 ~100 km · ~100 min today`, {
    font: "600 13px -apple-system, Segoe UI, sans-serif",
    pixelOffset: new Cesium.Cartesian2(0, 0),
  }),
});

// ---------------------------------------------------------------------------
// Camera tours
// ---------------------------------------------------------------------------
const siteCenter = Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 0);

function setActiveIn(selector, btn) {
  document.querySelectorAll(selector).forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function showToast(msg, ms) {
  const t = document.getElementById("infoToast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.remove("show"), ms || 5000);
}

let orbitHandle = null;
function stopOrbit() {
  if (orbitHandle) {
    viewer.clock.onTick.removeEventListener(orbitHandle);
    orbitHandle = null;
  }
}

function flyIntro() {
  stopOrbit();
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(78.9, 12.5, 1_600_000),
  });
  setTimeout(() => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 1400),
      orientation: { heading: Cesium.Math.toRadians(20), pitch: Cesium.Math.toRadians(-32) },
      duration: 4.2,
    });
  }, 250);
  showToast("Flying in from a national view down to the Thanjavur Air Force Station site…");
}

function orbitSite() {
  stopOrbit();
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 900),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-28) },
    duration: 1.6,
    complete: function () {
      const center = Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 40);
      let heading0 = 0;
      const start = performance.now();
      orbitHandle = function () {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed > 16) { stopOrbit(); return; }
        heading0 = Cesium.Math.toRadians(elapsed * 22);
        viewer.camera.lookAt(
          center,
          new Cesium.HeadingPitchRange(heading0, Cesium.Math.toRadians(-26), 950)
        );
      };
      viewer.clock.onTick.addEventListener(orbitHandle);
    },
  });
  showToast("Orbiting the proposed smart airport site — terminal, tower, cargo hub, and solar zone.");
}

function compareSites() {
  stopOrbit();
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      Math.min(A.lon, SITE.trichyAirport.lon) - 0.12,
      Math.min(A.lat, SITE.trichyAirport.lat) - 0.12,
      Math.max(A.lon, SITE.trichyAirport.lon) + 0.12,
      Math.max(A.lat, SITE.trichyAirport.lat) + 0.15
    ),
    duration: 2.2,
  });
  showToast(`Straight-line distance ${flightKm} km. Today: ~100 min by road to Trichy. Proposed: ~${estFlightMin} min gate-to-gate by air.`, 7000);
}

function flyToTemple() {
  stopOrbit();
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(SITE.temple.lon, SITE.temple.lat, 1100),
    orientation: { heading: Cesium.Math.toRadians(10), pitch: Cesium.Math.toRadians(-35) },
    duration: 2.4,
  });
  showToast("Brihadeeswarar Temple (UNESCO World Heritage Site) — 1.77 crore visitors in 2025, currently reliant on a 100-minute road transfer.", 7000);
}

document.getElementById("btn-intro").addEventListener("click", (e) => { exitTour(); setActiveIn(".map-panel .twin-btn", e.currentTarget); flyIntro(); });
document.getElementById("btn-site").addEventListener("click", (e) => { exitTour(); setActiveIn(".map-panel .twin-btn", e.currentTarget); orbitSite(); });
document.getElementById("btn-compare").addEventListener("click", (e) => { exitTour(); setActiveIn(".map-panel .twin-btn", e.currentTarget); compareSites(); });
document.getElementById("btn-city").addEventListener("click", (e) => { exitTour(); setActiveIn(".map-panel .twin-btn", e.currentTarget); flyToTemple(); });

document.getElementById("toggle-labels").addEventListener("click", (e) => {
  labelsDS.show = !labelsDS.show;
  e.currentTarget.classList.toggle("active", labelsDS.show);
  e.currentTarget.textContent = (labelsDS.show ? "✓ " : "") + "Facility Labels";
});
document.getElementById("toggle-routes").addEventListener("click", (e) => {
  routesDS.show = !routesDS.show;
  e.currentTarget.classList.toggle("active", routesDS.show);
  e.currentTarget.textContent = (routesDS.show ? "✓ " : "") + "Connectivity Routes";
});

// ---------------------------------------------------------------------------
// Guided Facility Tour — a scripted flight past every facility in the plan,
// with a caption per stop. This is the primary "show, don't tell" experience
// (the map/connectivity buttons above remain available as a secondary,
// optional view). Reuses the same camera.flyTo(destination, orientation)
// pattern as the map-view functions above, since that's the one verified to
// behave consistently across environments.
// ---------------------------------------------------------------------------

// Places the camera `backOffsetM` away from `center` (in compass direction
// `approachHeadingDeg`, i.e. the direction FROM the facility TO the camera)
// at `altitudeM`, facing back toward the facility, pitched down by `pitchDeg`.
function shotFor(center, approachHeadingDeg, backOffsetM, altitudeM, pitchDeg) {
  const camPos = destinationPoint(center.lat, center.lon, approachHeadingDeg, backOffsetM);
  return {
    destination: Cesium.Cartesian3.fromDegrees(camPos.lon, camPos.lat, altitudeM),
    orientation: {
      heading: Cesium.Math.toRadians((approachHeadingDeg + 180 + 360) % 360),
      pitch: Cesium.Math.toRadians(pitchDeg),
    },
  };
}

const TOUR_STOPS = [
  {
    title: "Welcome to the Site",
    desc: "The full proposed Smart Thanjavur Airport, built around the existing runway. Let's walk through every facility in the plan.",
    shot: () => ({
      destination: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 950),
      orientation: { heading: Cesium.Math.toRadians(heading - 20), pitch: Cesium.Math.toRadians(-32) },
    }),
    duration: 2.4,
    dwell: 4800,
  },
  {
    title: "Runway & Apron",
    desc: "The existing 3,400 m IAF runway that the whole plan is built around, with a new civil apron alongside it for aircraft turnaround.",
    shot: () => shotFor(A, heading - 55, 300, 340, -28),
    duration: 2.2,
    dwell: 4800,
  },
  {
    title: "Smart Passenger Terminal",
    desc: "Phase 2 of the plan. This is where the passenger portal's Smart QR — the same idea as DigiYatra at major Indian airports — replaces the physical boarding pass.",
    shot: () => shotFor(terminalCenter, heading + 145, 190, 95, -20),
    duration: 2.2,
    dwell: 5200,
  },
  {
    title: "Control Tower — AI Ops",
    desc: "AI-powered air-traffic and facility monitoring. This is what feeds the live Airport Ops Dashboard: terminal occupancy, energy use, and predictive-maintenance alerts.",
    shot: () => shotFor(towerCenter, heading + 145, 100, 75, -16),
    duration: 2,
    dwell: 4800,
  },
  {
    title: "Smart Cargo & Cold-Chain Hub",
    desc: "Phase 5. RFID-tracked shipments — Cauvery Delta rice, mango exports, pharma cold-chain — tracked live on the ops dashboard as they move through the hub.",
    shot: () => shotFor(cargoCenter, heading - 145, 170, 85, -20),
    duration: 2.2,
    dwell: 5200,
  },
  {
    title: "Solar Micro-grid Zone",
    desc: "Part of the Vision 2035 roadmap — sustainable on-site power for the terminal and the cold-chain cargo facilities.",
    shot: () => shotFor(solarCenter, heading - 145, 190, 120, -30),
    duration: 2,
    dwell: 4500,
  },
  {
    title: "Multimodal Transport Hub",
    desc: "Landside connectivity — linking the terminal to NH-36 and last-mile transit for the wider region.",
    shot: () => shotFor(transportCenter, heading - 55, 140, 75, -18),
    duration: 2,
    dwell: 4500,
  },
  {
    title: "Regional Connectivity",
    desc: `Thanjavur ↔ Trichy is ~100 km and ~100 minutes by road today. Direct air connectivity brings that down to ~${estFlightMin} minutes gate-to-gate — a boost for Brihadeeswarar Temple's tourist traffic too.`,
    shot: () => ({
      destination: Cesium.Rectangle.fromDegrees(
        Math.min(A.lon, SITE.trichyAirport.lon) - 0.12,
        Math.min(A.lat, SITE.trichyAirport.lat) - 0.12,
        Math.max(A.lon, SITE.trichyAirport.lon) + 0.12,
        Math.max(A.lat, SITE.trichyAirport.lat) + 0.15
      ),
    }),
    duration: 2.4,
    dwell: 5500,
  },
  {
    title: "That's the Full Plan",
    desc: "Runway, terminal, control tower, cargo hub, solar micro-grid, and transport hub — one integrated smart airport. Explore the map view, or open the passenger and ops dashboards next.",
    shot: () => ({
      destination: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 1400),
      orientation: { heading: Cesium.Math.toRadians(20), pitch: Cesium.Math.toRadians(-32) },
    }),
    duration: 2.4,
    dwell: 0,
  },
];

let tourActive = false;
let tourPaused = false;
let tourFlying = false;
let tourIndex = 0;
let tourAdvanceTimer = null;

const tourCaptionEl = document.getElementById("tourCaption");
const tourEyebrowEl = document.getElementById("tourStopEyebrow");
const tourTitleEl = document.getElementById("tourStopTitle");
const tourDescEl = document.getElementById("tourStopDesc");
const tourLiveControls = document.getElementById("tourLiveControls");
const tourStartBtn = document.getElementById("btn-tour-start");
const tourPrevBtn = document.getElementById("btn-tour-prev");
const tourNextBtn = document.getElementById("btn-tour-next");
const tourToggleBtn = document.getElementById("btn-tour-toggle");
const tourExitBtn = document.getElementById("btn-tour-exit");
const tourProgressEl = document.getElementById("tourProgress");

function clearTourTimer() {
  if (tourAdvanceTimer) { clearTimeout(tourAdvanceTimer); tourAdvanceTimer = null; }
}

function renderTourStop() {
  const stop = TOUR_STOPS[tourIndex];
  tourEyebrowEl.textContent = `Stop ${tourIndex + 1} of ${TOUR_STOPS.length}`;
  tourTitleEl.textContent = stop.title;
  tourDescEl.textContent = stop.desc;
  tourProgressEl.innerHTML = TOUR_STOPS.map((_, i) =>
    `<span class="tour-dot ${i === tourIndex ? "active" : i < tourIndex ? "done" : ""}"></span>`
  ).join("");
  tourPrevBtn.disabled = tourIndex === 0;
  tourNextBtn.disabled = tourIndex === TOUR_STOPS.length - 1;
}

function flyToStop(i) {
  stopOrbit();
  clearTourTimer();
  tourIndex = Math.max(0, Math.min(TOUR_STOPS.length - 1, i));
  const stop = TOUR_STOPS[tourIndex];
  const shot = stop.shot();
  tourFlying = true;
  renderTourStop();
  viewer.camera.flyTo(
    Object.assign({ duration: stop.duration != null ? stop.duration : 2.2 }, shot, {
      complete: function () {
        tourFlying = false;
        if (tourActive && !tourPaused && stop.dwell > 0 && tourIndex < TOUR_STOPS.length - 1) {
          const scheduledFor = tourIndex;
          tourAdvanceTimer = setTimeout(() => {
            if (tourActive && !tourPaused && tourIndex === scheduledFor) flyToStop(tourIndex + 1);
          }, stop.dwell);
        }
      },
    })
  );
}

function startTour() {
  tourActive = true;
  tourPaused = false;
  tourCaptionEl.hidden = false;
  tourLiveControls.hidden = false;
  tourStartBtn.hidden = true;
  tourToggleBtn.textContent = "⏸";
  flyToStop(0);
}

function exitTour() {
  if (!tourActive) return;
  tourActive = false;
  tourPaused = false;
  clearTourTimer();
  tourCaptionEl.hidden = true;
  tourLiveControls.hidden = true;
  tourStartBtn.hidden = false;
}

function toggleTourPause() {
  if (!tourActive) return;
  tourPaused = !tourPaused;
  tourToggleBtn.textContent = tourPaused ? "▶" : "⏸";
  if (tourPaused) {
    clearTourTimer();
  } else if (!tourFlying) {
    const stop = TOUR_STOPS[tourIndex];
    if (stop.dwell > 0 && tourIndex < TOUR_STOPS.length - 1) {
      const scheduledFor = tourIndex;
      tourAdvanceTimer = setTimeout(() => {
        if (tourActive && !tourPaused && tourIndex === scheduledFor) flyToStop(tourIndex + 1);
      }, stop.dwell);
    }
  }
}

tourStartBtn.addEventListener("click", startTour);
tourNextBtn.addEventListener("click", () => { if (tourIndex < TOUR_STOPS.length - 1) flyToStop(tourIndex + 1); });
tourPrevBtn.addEventListener("click", () => { if (tourIndex > 0) flyToStop(tourIndex - 1); });
tourToggleBtn.addEventListener("click", toggleTourPause);
tourExitBtn.addEventListener("click", exitTour);

// Start already framed on the site (static — guaranteed to render correctly
// everywhere) rather than auto-playing an animation on load. The Guided Tour
// and the Fly-in button still play their cinematics on demand; drag/scroll
// with the mouse always works too.
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, 1400),
  orientation: { heading: Cesium.Math.toRadians(20), pitch: Cesium.Math.toRadians(-32) },
});

// ---------------------------------------------------------------------------
// Site configuration for the Thanjavur Smart Airport digital twin.
//
// Coordinates for Thanjavur Air Force Station and Tiruchirappalli International
// Airport are taken from public aviation references (see project README).
// Runway heading, taxiway layout and building footprints are NOT public
// engineering drawings — they are a simplified, illustrative massing model
// placed at the correct real-world location, built for a course demo, not a
// construction document.
// ---------------------------------------------------------------------------

const SITE = {
  thanjavurAirport: { lat: 10.7200, lon: 79.1008, label: "Thanjavur Air Force Station (VOTJ)" },
  trichyAirport:    { lat: 10.7654, lon: 78.7097, label: "Tiruchirappalli Intl. Airport (VOTR)" },
  temple:           { lat: 10.7825, lon: 79.1319, label: "Brihadeeswarar Temple (UNESCO)" },
  thanjavurCity:    { lat: 10.7870, lon: 79.1378, label: "Thanjavur City" },

  // Illustrative runway heading (public AIP charts were not available to us).
  runwayHeadingDeg: 85,
  runwayLengthM: 3400,
  runwayWidthM: 45,
};

// Earth radius for spherical approximations (meters).
const EARTH_R = 6371000;

function toRad(d) { return (d * Math.PI) / 180; }
function toDeg(r) { return (r * 180) / Math.PI; }

// Great-circle "destination point" given start, bearing (deg) and distance (m).
function destinationPoint(lat, lon, bearingDeg, distanceM) {
  const δ = distanceM / EARTH_R;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return { lat: toDeg(φ2), lon: toDeg(λ2) };
}

// Haversine distance in meters.
function haversineDistance(a, b) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lon - a.lon);
  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

// Build a rectangular footprint (array of {lat,lon} corners) centered at
// `center`, oriented at `headingDeg` (0 = north, clockwise), with given
// length (along heading) and width (perpendicular) in meters.
function rectFootprint(center, headingDeg, lengthM, widthM) {
  const halfL = lengthM / 2;
  const halfW = widthM / 2;
  const fwd = headingDeg;
  const side = headingDeg + 90;

  function offset(alongM, acrossM) {
    const p1 = destinationPoint(center.lat, center.lon, fwd, alongM);
    return destinationPoint(p1.lat, p1.lon, side, acrossM);
  }

  return [
    offset(-halfL, -halfW),
    offset(halfL, -halfW),
    offset(halfL, halfW),
    offset(-halfL, halfW),
  ];
}

function footprintToDegreesArray(points) {
  const arr = [];
  points.forEach((p) => {
    arr.push(p.lon, p.lat);
  });
  return arr;
}

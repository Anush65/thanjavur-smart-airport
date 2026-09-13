# Smart Development of Thanjavur Airport — Demo Prototype

A working proof-of-concept built to accompany the Design of Smart Cities project
report/slides. It turns three pieces of the proposed framework into something
you can actually click through live, instead of only describing them on a slide.

## What's in here

- **`digital-twin/`** — a CesiumJS 3D digital twin of the airport site: real
  Thanjavur coordinates, a simplified massing model (terminal, control tower,
  cargo hub, solar zone), a flight path vs. the current 100-minute road route
  to Trichy, and a marker on Brihadeeswarar Temple. Runs entirely offline
  except for the OpenStreetMap basemap tiles (no API key or account needed).
  The default, primary experience is the **Guided Facility Tour** — a
  scripted flight past every facility (runway, terminal, tower, cargo hub,
  solar zone, transport hub) with a caption per stop, plus Play/Pause,
  Next/Prev and Exit controls. The map/connectivity camera presets (fly-in,
  orbit, compare-to-Trichy, temple) are kept as a secondary "Map &
  Connectivity (optional)" panel underneath it.
- **`webapp/`** — the passenger + airport-ops web portal:
  - `index.html` — landing page linking everything together
  - `passenger.html` — enter any booking reference, get a live-generated
    smart QR boarding pass (no physical ticket)
  - `ops.html` — a staff-facing live dashboard: flight board, terminal
    occupancy, energy usage, AI predictive-maintenance alerts, RFID cargo
    tracking
- **`shared/style.css`** — shared visual theme across the web pages.

Everything is plain HTML/CSS/JS with the needed libraries (Cesium, Chart.js,
a QR code generator) already bundled locally in each `vendor/` folder — no
build step, no `npm install` needed to run it.

## How to run it

Because the digital twin loads map tiles and the pages reference each other
by relative path, open them through a local web server rather than
double-clicking the files:

```
cd thanjavur-smart-airport
python3 -m http.server 8000
```

Then open **http://localhost:8000/webapp/index.html** in Chrome. From there,
the "Digital Twin" link opens the 3D site model.

If you don't have Python handy, any static server works (`npx serve`,
VS Code's "Live Server" extension, etc.) — it just needs to serve the whole
`thanjavur-smart-airport` folder.

**You do need internet access** on the demo machine for the digital twin's
map tiles (OpenStreetMap) to load — test this on the actual room's wifi
beforehand if you can. The passenger portal and ops dashboard need no
internet at all once the page is open.

## What's real vs. simulated — say this out loud during the demo

Be upfront about this; it's a strength, not a weakness — it shows you know
exactly what you built:

- **Real:** Thanjavur/Trichy airport coordinates, the temple location, the
  straight-line distance calculation, the 3,400 m runway length and 100 km /
  100 min road figures (from your own report).
- **Simulated for the demo:** the terminal/tower/cargo-hub building shapes
  (a simplified massing model, not an engineering blueprint — say this
  explicitly), all flight/passenger/cargo data, the "AI" predictive-maintenance
  alert (scripted to trigger after ~9 seconds so you can point at it live),
  and the energy/occupancy numbers (random-walk simulated).

## Suggested demo flow (~4–5 minutes)

1. **Digital twin** — open it, let the site load, click **"▶ Start Facility
   Tour"** and let it run (or drive it with Next/Prev) as you narrate each
   stop: runway → terminal → control tower → cargo hub → solar zone →
   transport hub → regional connectivity. This is the main visual — lead
   with it. The "Map & Connectivity" panel underneath (fly-in, orbit,
   compare-to-Trichy, temple) is there if you want the geographic framing
   too, but treat it as optional/secondary.
2. **Passenger portal** — type any booking code, show the smart QR boarding
   pass, mention DigiYatra as the real-world precedent already live at major
   Indian airports.
3. **Ops dashboard** — open it and just let it sit on screen while you talk;
   after ~9 seconds the HVAC unit alert will flip to a predictive-maintenance
   warning on its own — point at it when it happens, that's your "AI" moment.
4. Close by tying it back to your framework slide: GIS (digital twin), IoT +
   AI (ops dashboard), smart tourism/biometric (QR boarding pass).

## One thing to test beforehand

The digital twin's "Fly-in" and other animated camera-tour buttons rely on
smooth WebGL rendering. They work fine on normal laptop/desktop GPUs, but a
couple of very old or software-only graphics setups can occasionally render
the 3D view incorrectly during the animation. The page always **loads
already framed on the site** (no animation required to see it), and the
labels/legend/manual mouse controls (drag to rotate, scroll to zoom) work
regardless — so even in the unlikely case a tour button misbehaves, reloading
the page or just using the mouse gets you back to a working view instantly.
Test it once on the actual presentation laptop beforehand, as you would with
any live demo.

## Pushing this to GitHub

This project folder is already a git repo with one commit (`git log` shows
it). To get it onto GitHub:

1. Go to [github.com/new](https://github.com/new) and create a new **empty**
   repository (no README/license/gitignore — this folder already has its
   own). Name it whatever you like, e.g. `thanjavur-smart-airport`.
2. Copy the "…or push an existing repository from the command line" commands
   GitHub shows you, or just run these from inside this folder (replace the
   URL with the one GitHub gives you):

   ```
   git remote add origin https://github.com/<your-username>/thanjavur-smart-airport.git
   git push -u origin main
   ```

3. If `git push` asks for a password, GitHub no longer accepts your account
   password there — use a **personal access token** instead (Settings →
   Developer settings → Personal access tokens), or push via GitHub Desktop
   / VS Code's built-in git support if you have either installed, which
   handles login for you.

Everything (Cesium/Chart.js/QR-code libraries included, ~35 MB) is already
committed, so those two commands are all that's needed.

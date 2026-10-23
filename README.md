# Thanjavur Smart Airport Demo

This project is a lightweight interactive prototype for a smart airport concept centered on Thanjavur. It combines a 3D airport digital twin, a passenger experience, and an operations dashboard with simulated IoT and AI monitoring.

## What the project does

- Digital twin of the airport site using CesiumJS
  - Shows a simplified airport layout near the real Thanjavur location
  - Includes a guided tour of the runway, terminal, control tower, cargo hub, solar zone, and transport connections
  - Compares the proposed site with the road access to Trichy

- Passenger portal
  - Lets users enter a mock booking reference
  - Generates a smart QR-style boarding pass for a passenger journey
  - Demonstrates a DigiYatra-style digital travel experience

- Airport operations dashboard
  - Displays simulated flight status, terminal occupancy, energy use, predictive maintenance alerts, and cargo tracking
  - Shows how AI and IoT-informed airport operations could work in a future smart airport

- Machine learning module
  - Generates 1,200 synthetic sensor readings for airport equipment
  - Trains a Random Forest predictive-maintenance classifier
  - Uses the model to estimate whether maintenance is required before failure occurs

This is a front-end demo built with plain HTML, CSS, and JavaScript. The required libraries are included locally, so there is no build step or package installation required.

## Project structure

- `digital-twin/` — 3D airport digital twin and site exploration experience
- `webapp/` — passenger portal and operations dashboard
- `ml/` — synthetic predictive-maintenance data and Random Forest model training script
- `shared/style.css` — shared styling for the web pages

## How to run it

From the project root, start a local web server:

```bash
cd thanjavavur-smart-airport
python3 -m http.server 8000
```

Then open the following in your browser:

- http://localhost:8000/webapp/index.html

This landing page links to the passenger portal, airport operations dashboard, and digital twin.

### Machine learning workflow

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python predictive_maintenance.py
```

The script creates a synthetic dataset with 1,200 records, trains a Random Forest model, and writes the evaluation summary to `ml/maintenance_model_summary.json`.

If Python is not available, any static file server will work as long as it serves the project folder. For example, you can also use a VS Code Live Server or a simple `npx serve` setup.

## Notes

- The digital twin loads OpenStreetMap tiles, so an internet connection is needed for the map base layer.
- The passenger and operations pages are simulated demo data, designed to illustrate the concept rather than connect to real airport systems.
- No build tools, database, or backend service are required for local use.
- The predictive-maintenance model is a synthetic example designed for demonstration and prototype testing.

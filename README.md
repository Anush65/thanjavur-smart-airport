# Thanjavur Smart Airport Demo

This project is a lightweight interactive prototype for a smart airport concept centered on Thanjavur. It combines a 3D airport digital twin, a passenger experience, and an operations dashboard with synthetic demo data.

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
  - Generates synthetic sensor readings for airport equipment
  - Trains a Random Forest predictive-maintenance classifier
  - Saves the generated dataset and evaluation summary

This is a front-end demo built with plain HTML, CSS, and JavaScript. The required libraries are included locally, so there is no build step or package installation required.

## Project structure

- `digital-twin/` — 3D airport digital twin and site exploration experience
- `webapp/` — passenger portal and operations dashboard
- `ml/` — synthetic predictive-maintenance data and Random Forest model training script
- `shared/style.css` — shared styling for the web pages

## Run the web app

From the project root:

```bash
python3 serve_project.py --port 8000
```

Then open:

- http://127.0.0.1:8000/webapp/index.html

Alternative static server:

```bash
cd thanjavavur-smart-airport
python3 -m http.server 8000
```

## Run the machine learning flow

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python predictive_maintenance.py
```

The script creates a synthetic dataset with 1,200 records, trains a Random Forest model, and writes:

- `ml/maintenance_dataset.csv`
- `ml/maintenance_model_summary.json`

## Notes

- The digital twin loads OpenStreetMap tiles, so an internet connection is needed for the map base layer.
- The passenger and operations pages are simulated demo data, designed to illustrate the concept rather than connect to real airport systems.
- No build tools, database, or backend service are required for local use.
- The predictive-maintenance model is a synthetic example designed for demonstration and prototype testing.

# Thanjavur Smart Airport

This directory contains a synthetic predictive-maintenance dataset and a Random Forest model for airport equipment monitoring.

## What it does

- Generates 1,200 synthetic sensor records for airport assets.
- Trains a Random Forest classifier to predict whether maintenance is required.
- Saves the dataset and evaluation metrics to the `ml/` folder.
- Uses realistic features such as temperature, vibration, pressure, humidity, runtime hours, load, oil quality, and energy usage.

## Run the model

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python predictive_maintenance.py
```

The script will:

1. Create `maintenance_dataset.csv`
2. Train a Random Forest model
3. Save `maintenance_model_summary.json`
4. Print precision, recall, F1-score, and feature importance

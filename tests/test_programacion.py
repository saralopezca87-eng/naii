import pytest
from fastapi.testclient import TestClient
from backend_riego.main import app
from datetime import datetime, timedelta

client = TestClient(app)

def test_status_endpoint():
    response = client.get("/status")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_valve_schedule_hours_validation():
    now = datetime.now()
    start = (now + timedelta(minutes=2)).strftime("%Y-%m-%dT%H:%M")
    end = (now + timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M")
    # Programación válida
    response = client.post("/valve/1/schedule_hours", json={"start": start, "end": end})
    assert response.status_code == 200
    # Hora de fin antes de inicio
    response = client.post("/valve/1/schedule_hours", json={"start": end, "end": start})
    assert response.status_code == 400
    # Rango pasado
    past = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M")
    response = client.post("/valve/1/schedule_hours", json={"start": past, "end": end})
    assert response.status_code == 400
    # Rango demasiado largo
    long_end = (now + timedelta(days=8)).strftime("%Y-%m-%dT%H:%M")
    response = client.post("/valve/1/schedule_hours", json={"start": start, "end": long_end})
    assert response.status_code == 400

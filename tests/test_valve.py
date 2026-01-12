import pytest
from fastapi.testclient import TestClient
from backend_riego.main import app

client = TestClient(app)

def test_valve_on_off():
    # Encender válvula
    response = client.post("/valve/1/on")
    assert response.status_code == 200
    assert response.json()["status"] == "on"
    # Apagar válvula
    response = client.post("/valve/1/off")
    assert response.status_code == 200
    assert response.json()["status"] == "off"

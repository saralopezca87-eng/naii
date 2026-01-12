import pytest
from fastapi.testclient import TestClient
from backend_riego.main import app

client = TestClient(app)

def test_get_public_ip():
    response = client.get("/get-public-ip")
    assert response.status_code == 200
    assert "ip" in response.json() or "error" in response.json()

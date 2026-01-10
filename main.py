from fastapi import FastAPI
from valves import turn_on, turn_off, get_status
from scheduler import schedule_valve
from logger import log

app = FastAPI(title="Sistema de Riego API")

@app.on_event("startup")
def startup():
    log("API STARTED")

@app.get("/status")
def status():
    log("STATUS REQUEST")
    return get_status()

@app.post("/valve/{valve_id}/on")
def valve_on(valve_id: int):
    turn_on(valve_id)
    return {"valve": valve_id, "state": "ON"}

@app.post("/valve/{valve_id}/off")
def valve_off(valve_id: int):
    turn_off(valve_id)
    return {"valve": valve_id, "state": "OFF"}

@app.post("/valve/{valve_id}/schedule")
def valve_schedule(valve_id: int, seconds: int):
    schedule_valve(valve_id, seconds)
    return {
        "valve": valve_id,
        "scheduled": True,
        "duration": seconds
    }

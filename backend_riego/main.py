# main.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, time

from valves import turn_on, turn_off, get_status
from scheduler import schedule_valve, schedule_valve_hours
from logger import log_event

app = FastAPI(title="Sistema de Riego")

# --- CORS ---
origins = [
    "https://sistemaderiego.online",  # Frontend Netlify
    "http://localhost:3000"            # Pruebas locales
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Endpoints ---

@app.get("/status")
async def status():
    log_event("GET /status solicitado")
    status_data = get_status()
    log_event(f"Estado actual: {status_data}")
    return status_data

@app.post("/valve/{valve_id}/on")
async def valve_on(valve_id: int):
    log_event(f"POST /valve/{valve_id}/on solicitado")
    turn_on(valve_id)
    log_event(f"Válvula {valve_id} ENCENDIDA")
    return {"id": valve_id, "status": "on"}

@app.post("/valve/{valve_id}/off")
async def valve_off(valve_id: int):
    log_event(f"POST /valve/{valve_id}/off solicitado")
    turn_off(valve_id)
    log_event(f"Válvula {valve_id} APAGADA")
    return {"id": valve_id, "status": "off"}

# --- Programación por segundos (legacy) ---
@app.post("/valve/{valve_id}/schedule")
async def valve_schedule(valve_id: int, seconds: int):
    log_event(f"POST /valve/{valve_id}/schedule solicitado por {seconds} segundos")
    schedule_valve(valve_id, seconds)
    log_event(f"Válvula {valve_id} programada por {seconds} segundos")
    return {"id": valve_id, "status": "scheduled", "seconds": seconds}

# --- Programación por horas (nuevo) ---


# Modelo Pydantic para la programación
class ScheduleRequest(BaseModel):
    start: str
    end: str

@app.post("/valve/{valve_id}/schedule_hours")
async def valve_schedule_hours(valve_id: int, req: ScheduleRequest):
    """
    start y end en formato ISO: YYYY-MM-DDTHH:MM
    """
    log_event(f"POST /valve/{valve_id}/schedule_hours solicitado desde {req.start} hasta {req.end}")

    try:
        start_dt = datetime.strptime(req.start, "%Y-%m-%dT%H:%M")
        end_dt = datetime.strptime(req.end, "%Y-%m-%dT%H:%M")
    except ValueError:
        log_event(f"Formato de fecha/hora inválido: start={req.start}, end={req.end}")
        raise HTTPException(status_code=400, detail="Formato de fecha/hora inválido. Use YYYY-MM-DDTHH:MM")

    schedule_valve_hours(valve_id, start_dt, end_dt)
    log_event(f"Válvula {valve_id} programada de {req.start} a {req.end}")
    return {"id": valve_id, "status": "scheduled_hours", "start": req.start, "end": req.end}

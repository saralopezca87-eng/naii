# main.py

# =========================
# IMPORTS
# =========================
from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import requests
import os

from backend_riego.valves import turn_on, turn_off, get_status
from backend_riego.scheduler import schedule_valve, schedule_valve_hours
from backend_riego.logger import log_event


# =========================
# APP
# =========================

app = FastAPI(title="Sistema de Riego")

# APScheduler maneja la persistencia automáticamente, no es necesario restaurar manualmente


# =========================
# CORS
# =========================
origins = [
    "https://sistemaderiego.online",
    "https://api.sistemaderiego.online",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================
# MODELOS
# =========================
class ScheduleRequest(BaseModel):
    start: str = "2026-01-11T23:00"  # Fecha y hora de inicio en formato ISO8601
    end: str = "2026-01-11T23:02"    # Fecha y hora de fin en formato ISO8601

    class Config:
        schema_extra = {
            "example": {
                "start": "2026-01-11T23:00",
                "end": "2026-01-11T23:02"
            }
        }


# =========================
# ENDPOINTS GENERALES
# =========================
@app.get("/get-public-ip")
async def get_public_ip():
    try:
        ip = requests.get("https://api.ipify.org").text
        return {"ip": ip}
    except Exception as e:
        log_event(f"Error obteniendo IP pública: {e}")
        return {"error": "No se pudo obtener la IP pública"}


# =========================
# ESTADO DEL SISTEMA
# =========================
@app.get(
    "/status",
    summary="Estado de todas las válvulas",
    description="Devuelve el estado actual (on/off) de todas las válvulas."
)
async def status():
    """Obtener el estado actual de todas las válvulas"""
    log_event("GET /status solicitado")
    status_data = get_status()
    log_event(f"Estado de válvulas: {status_data}")
    return {str(k): v for k, v in status_data.items()}


# =========================
# CONTROL DE VÁLVULAS
# =========================
@app.post(
    "/valve/{valve_id}/on",
    summary="Enciende una válvula",
    description="Enciende la válvula indicada de forma inmediata."
)
async def valve_on(valve_id: int):
    log_event(f"POST /valve/{valve_id}/on solicitado")
    turn_on(valve_id)
    log_event(f"Válvula {valve_id} ENCENDIDA")
    return {"id": valve_id, "status": "on"}


@app.post(
    "/valve/{valve_id}/off",
    summary="Apaga una válvula",
    description="Apaga la válvula indicada de forma inmediata."
)
async def valve_off(valve_id: int):
    log_event(f"POST /valve/{valve_id}/off solicitado")
    turn_off(valve_id)
    log_event(f"Válvula {valve_id} APAGADA")
    return {"id": valve_id, "status": "off"}


# =========================
# PROGRAMACIÓN
# =========================
@app.post(
    "/valve/{valve_id}/schedule",
    summary="Programa una válvula por segundos",
    description="Programa la válvula indicada para encenderse durante una cantidad de segundos."
)
async def valve_schedule(valve_id: int, seconds: int = Body(..., example=60)):
    log_event(f"POST /valve/{valve_id}/schedule por {seconds} segundos")
    schedule_valve(valve_id, seconds)
    return {
        "id": valve_id,
        "status": "scheduled",
        "seconds": seconds
    }


@app.post(
    "/valve/{valve_id}/schedule_hours",
    summary="Programa una válvula por rango de fecha/hora",
    description="Programa la válvula indicada para encenderse y apagarse automáticamente entre las fechas y horas especificadas. El rango debe ser futuro, válido y no mayor a 7 días."
)
async def valve_schedule_hours(valve_id: int, req: ScheduleRequest = Body(...)):
    log_event(f"DEBUG BODY: {req}"); print(f"DEBUG BODY: {req}")
    try:
        log_event(f"Recibido start: {req.start}, end: {req.end}"); print(f"Recibido start: {req.start}, end: {req.end}")
        # Try parsing with seconds first, luego sin segundos
        try:
            start_dt = datetime.strptime(req.start, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            start_dt = datetime.strptime(req.start, "%Y-%m-%dT%H:%M")
        try:
            end_dt = datetime.strptime(req.end, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            end_dt = datetime.strptime(req.end, "%Y-%m-%dT%H:%M")
        log_event(f"Parsed start_dt: {start_dt}, end_dt: {end_dt}"); print(f"Parsed start_dt: {start_dt}, end_dt: {end_dt}")
    except ValueError:
        log_event(f"Formato inválido: {req.start} - {req.end}"); print(f"Formato inválido: {req.start} - {req.end}")
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Use YYYY-MM-DDTHH:MM o YYYY-MM-DDTHH:MM:SS"
        )
    now = datetime.now()
    log_event(f"now: {now}, start_dt: {start_dt}, end_dt: {end_dt}"); print(f"now: {now}, start_dt: {start_dt}, end_dt: {end_dt}")
    from datetime import timedelta
    # Validaciones adicionales
    if start_dt < now - timedelta(minutes=1):
        log_event(f"Hora de inicio inválida (pasada): {req.start} -> {start_dt}, ahora: {now}"); print(f"Hora de inicio inválida (pasada): {req.start} -> {start_dt}, ahora: {now}")
        raise HTTPException(
            status_code=400,
            detail="La hora de inicio debe ser igual o posterior a la hora actual (tolerancia 1 min)."
        )
    if end_dt <= start_dt:
        log_event(f"Hora de fin inválida: end <= start. start: {start_dt}, end: {end_dt}"); print(f"Hora de fin inválida: end <= start. start: {start_dt}, end: {end_dt}")
        raise HTTPException(
            status_code=400,
            detail="La hora de fin debe ser posterior a la hora de inicio."
        )
    if (end_dt - start_dt) > timedelta(days=7):
        log_event(f"Rango demasiado largo: más de 7 días. start: {start_dt}, end: {end_dt}"); print(f"Rango demasiado largo: más de 7 días. start: {start_dt}, end: {end_dt}")
        raise HTTPException(
            status_code=400,
            detail="El rango máximo permitido es de 7 días."
        )
    log_event(f"Programando válvula {valve_id} de {start_dt} a {end_dt} (ahora: {now})"); print(f"Programando válvula {valve_id} de {start_dt} a {end_dt} (ahora: {now})")
    schedule_valve_hours(valve_id, start_dt, end_dt)
    log_event(f"Válvula {valve_id} programada de {req.start} a {req.end}"); print(f"Válvula {valve_id} programada de {req.start} a {req.end}")
    return {
        "id": valve_id,
        "status": "scheduled_hours",
        "start": req.start,
        "end": req.end
    }


# =========================
# SISTEMA (REBOOT / SHUTDOWN)
# =========================
@app.post("/reboot")
async def reboot(request: Request):
    log_event("Reinicio solicitado desde el frontend")
    os.system("sudo reboot")
    return {
        "message": "Reiniciando sistema. Espera 3 minutos."
    }


@app.post("/shutdown")
async def shutdown(request: Request):
    log_event("Apagado solicitado desde el frontend")
    os.system("sudo shutdown now")
    return {
        "message": "Apagando sistema."
    }


@app.post("/poweron")
async def poweron(request: Request):
    log_event("Encendido solicitado (requiere hardware especial)")
    return {
        "message": "Encendido remoto requiere hardware adicional."
    }

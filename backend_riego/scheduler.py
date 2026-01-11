# scheduler.py
import threading
import time as t
from datetime import datetime, time as dtime
from valves import turn_on, turn_off
from logger import log_event

# Diccionarios para almacenar tareas activas
scheduled_tasks = {}
scheduled_hour_tasks = {}

# --- Programación por segundos (legacy) ---
def schedule_valve(valve_id: int, seconds: int):
    """Programa la válvula para encender por X segundos"""
    def task():
        log_event(f"[Segundos] Válvula {valve_id} ENCENDIDA por {seconds} segundos")
        turn_on(valve_id)
        t.sleep(seconds)
        turn_off(valve_id)
        log_event(f"[Segundos] Válvula {valve_id} APAGADA")
        # Eliminar tarea al finalizar
        scheduled_tasks.pop(valve_id, None)

    if valve_id in scheduled_tasks:
        log_event(f"[Segundos] Cancelando tarea previa de la válvula {valve_id}")
        scheduled_tasks[valve_id].cancel()

    thread = threading.Thread(target=task)
    thread.start()
    scheduled_tasks[valve_id] = thread

# --- Programación por horas ---

def schedule_valve_hours(valve_id: int, start: dtime, end: dtime):
    """
    Programa la válvula para encender automáticamente solo entre la fecha y hora de inicio y fin exactas.
    Funciona en background usando un thread que revisa cada minuto.
    """
    def hour_task():
        log_event(f"[Fecha/Hora] Hilo iniciado para válvula {valve_id}: {start} -> {end}")
        encendida = False
        while True:
            now = datetime.now()
            if start <= now <= end:
                if not encendida:
                    log_event(f"[Fecha/Hora] Válvula {valve_id} ENCENDIDA (dentro del rango)")
                    turn_on(valve_id)
                    encendida = True
            else:
                if encendida:
                    log_event(f"[Fecha/Hora] Válvula {valve_id} APAGADA (fuera del rango)")
                    turn_off(valve_id)
                    encendida = False
            t.sleep(60)  # revisa cada minuto

    # Cancelar tarea previa si existe
    if valve_id in scheduled_hour_tasks:
        log_event(f"[Fecha/Hora] Cancelando tarea previa de la válvula {valve_id}")
        scheduled_hour_tasks[valve_id] = None

    thread = threading.Thread(target=hour_task, daemon=True)
    thread.start()
    scheduled_hour_tasks[valve_id] = thread

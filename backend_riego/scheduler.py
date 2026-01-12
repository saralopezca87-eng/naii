# scheduler.py
import threading
import time as t
from datetime import datetime
import json
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from backend_riego.valves import turn_on, turn_off
from backend_riego.logger import log_event, log_error, log_warning

# Diccionarios para almacenar tareas activas

# APScheduler setup
JOBSTORE_PATH = os.path.join(os.path.dirname(__file__), 'apscheduler_jobs.sqlite')
jobstores = {
    'default': SQLAlchemyJobStore(url=f'sqlite:///{JOBSTORE_PATH}')
}
apscheduler = BackgroundScheduler(jobstores=jobstores, timezone="UTC")
apscheduler.start()

def _valve_on_job(valve_id):
    log_event(f"[APScheduler] Encendiendo válvula {valve_id}")
    turn_on(valve_id)

def _valve_off_job(valve_id):
    log_event(f"[APScheduler] Apagando válvula {valve_id}")
    turn_off(valve_id)

def schedule_valve_hours(valve_id: int, start: datetime, end: datetime, persist=True):
    """
    Programa la válvula usando APScheduler para encender y apagar entre start y end.
    """
    # Cancelar trabajos previos para esta válvula
    remove_valve_jobs(valve_id)
    # Programar encendido
    apscheduler.add_job(_valve_on_job, 'date', run_date=start, args=[valve_id], id=f"valve_{valve_id}_on", replace_existing=True)
    # Programar apagado
    apscheduler.add_job(_valve_off_job, 'date', run_date=end, args=[valve_id], id=f"valve_{valve_id}_off", replace_existing=True)
    log_event(f"[APScheduler] Programada válvula {valve_id} de {start} a {end}")

def remove_valve_jobs(valve_id: int):
    """Elimina trabajos programados para una válvula."""
    for suffix in ["on", "off"]:
        job_id = f"valve_{valve_id}_{suffix}"
        try:
            apscheduler.remove_job(job_id)
            log_event(f"[APScheduler] Eliminado job {job_id}")
        except Exception:
            pass

def load_scheduled_tasks(schedule_valve_hours_func=None):
    """No es necesario con APScheduler: la persistencia es automática."""
    log_event("[APScheduler] Persistencia automática habilitada.")

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

def schedule_valve_hours(valve_id: int, start: datetime, end: datetime, persist=True):
    """
    Programa la válvula para encender automáticamente solo entre la fecha y hora de inicio y fin exactas.
    Funciona en background usando un thread que espera hasta la hora de inicio y luego controla la válvula.
    """
    def hour_task():
        # Guardar los datos de programación en el thread para persistencia
        threading.current_thread().start_time = start
        threading.current_thread().end_time = end
        try:
            now = datetime.now()
            log_event(f"[Fecha/Hora] Programando válvula {valve_id}: {start} -> {end} (ahora: {now})")

            # Si la hora de inicio es futura, esperar hasta entonces
            if start > now:
                wait_seconds = (start - now).total_seconds()
                log_event(f"[Fecha/Hora] Esperando {wait_seconds:.0f} segundos hasta el inicio")
                t.sleep(wait_seconds)

            # Verificar nuevamente después de esperar
            now = datetime.now()
            log_event(f"[Fecha/Hora] Después de esperar, ahora: {now}, start: {start}, end: {end}")
            if start <= now <= end:
                log_event(f"[Fecha/Hora] Válvula {valve_id} ENCENDIDA (inicio del rango)")
                turn_on(valve_id)

                # Calcular cuánto tiempo mantener encendida
                remaining_seconds = (end - now).total_seconds()
                log_event(f"[Fecha/Hora] Tiempo restante: {remaining_seconds:.0f} segundos")
                if remaining_seconds > 0:
                    log_event(f"[Fecha/Hora] Manteniendo encendida por {remaining_seconds:.0f} segundos")
                    t.sleep(remaining_seconds)

                # Apagar al final del rango
                log_event(f"[Fecha/Hora] Válvula {valve_id} APAGADA (fin del rango)")
                turn_off(valve_id)
            else:
                log_event(f"[Fecha/Hora] Rango de tiempo expirado o inválido para válvula {valve_id}: start <= now <= end? {start <= now <= end}, now > end? {now > end}")
        except Exception as e:
            log_event(f"[Fecha/Hora][ERROR] Excepción en hour_task de válvula {valve_id}: {e}")

    # Cancelar tarea previa si existe
    prev_thread = scheduled_hour_tasks.get(valve_id)
    if prev_thread is not None:
        log_event(f"[Fecha/Hora] Cancelando tarea previa de la válvula {valve_id}")
        if prev_thread.is_alive():
            log_event(f"[Fecha/Hora][ADVERTENCIA] El thread anterior de la válvula {valve_id} sigue vivo. No se puede cancelar, pero se ignora en la referencia.")
        scheduled_hour_tasks[valve_id] = None

    thread = threading.Thread(target=hour_task, daemon=True)
    thread.start()
    scheduled_hour_tasks[valve_id] = thread
    log_event(f"[Fecha/Hora] Thread iniciado para válvula {valve_id}")

    # Guardar en disco si es una nueva programación
    if persist:
        save_scheduled_tasks()

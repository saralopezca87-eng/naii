import datetime
import os

# Permitir cambiar la ruta del log fácilmente
LOG_FILE = os.environ.get("RIEGO_LOG_FILE", os.path.join(os.path.dirname(__file__), "backend.log"))

def log_event(message: str, level: str = "INFO"):
    """Imprime en consola y guarda en archivo de log con nivel."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] [{level}] {message}"
    print(log_message)

    # Guardar en archivo de log
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(log_message + "\n")
    except Exception as e:
        print(f"[LOGGER][ERROR] Error escribiendo en log: {e}")

def log_error(message: str):
    log_event(message, level="ERROR")

def log_warning(message: str):
    log_event(message, level="WARNING")

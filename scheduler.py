import threading
import time
from valves import turn_on, turn_off
from logger import log

def schedule_valve(valve_id: int, duration_seconds: int):
    def task():
        log(f"PROGRAM START valve={valve_id} duration={duration_seconds}s")
        turn_on(valve_id)
        time.sleep(duration_seconds)
        turn_off(valve_id)
        log(f"PROGRAM END valve={valve_id}")

    threading.Thread(target=task).start()

from logger import log
from config import TOTAL_VALVES

# ESTADO EN MEMORIA (por ahora)
valve_state = {i: False for i in range(1, TOTAL_VALVES + 1)}

def turn_on(valve_id: int):
    valve_state[valve_id] = True
    log(f"VALVE {valve_id} -> ON")

def turn_off(valve_id: int):
    valve_state[valve_id] = False
    log(f"VALVE {valve_id} -> OFF")

def get_status():
    return valve_state

const API_URL = "https://api.sistemaderiego.online";
// Token se eliminará, controlaremos acceso luego con Firebase Auth
// const API_TOKEN = "MI_TOKEN_SUPER_SEGURO_12345"; 

const valvesContainer = document.getElementById("valves-container");

// CREAR TARJETAS DE VÁLVULAS
function createValveCard(id, state) {
  const card = document.createElement("div");
  card.classList.add("valve-card");
  if (state) card.classList.add("active");
  card.id = `valve-${id}`;

  card.innerHTML = `
    <h2>Válvula ${id}</h2>
    <p>Estado: <span class="state-text">${state ? "ON" : "OFF"}</span></p>
    <button onclick="toggleValve(${id})">${state ? "Apagar" : "Encender"}</button>

    <div class="schedule-container">
      <label>Desde: <input type="time" id="start-${id}"></label>
      <label>Hasta: <input type="time" id="end-${id}"></label>
      <button onclick="scheduleValve(${id})">Programar</button>
    </div>
  `;

  valvesContainer.appendChild(card);
}

// CARGAR ESTADO INICIAL
async function loadStatus() {
  try {
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) throw new Error("Error al obtener estado");
    const data = await res.json();
    valvesContainer.innerHTML = "";
    for (let id = 1; id <= 12; id++) {
      createValveCard(id, data[id]);
    }
  } catch (e) {
    console.error("No se pudo cargar el estado:", e);
    valvesContainer.innerHTML = "<p style='color:red;'>Error conectando al backend</p>";
  }
}

// ENCENDER / APAGAR
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
  loadStatus();
}

// PROGRAMAR VÁLVULA POR INTERVALO DE HORAS
async function scheduleValve(id) {
  const start = document.getElementById(`start-${id}`).value;
  const end = document.getElementById(`end-${id}`).value;

  if (!start || !end) return alert("Selecciona hora de inicio y fin");

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const startTime = `${startHour}:${startMin}`;
  const endTime = `${endHour}:${endMin}`;

  const res = await fetch(`${API_URL}/valve/${id}/schedule_by_hours`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: startTime, end: endTime })
  });

  if (res.ok) {
    alert(`Válvula ${id} programada de ${start} a ${end}`);
  } else {
    alert("Error al programar la válvula");
  }

  loadStatus();
}

// CARGAR AL INICIO
loadStatus();

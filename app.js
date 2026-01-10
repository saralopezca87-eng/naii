// app.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQJfBPBGFo8IujYZeNK3kr6EiX9xCGvdU",
  authDomain: "sistemaderiego-8950d.firebaseapp.com",
  projectId: "sistemaderiego-8950d",
  storageBucket: "sistemaderiego-8950d.firebasestorage.app",
  messagingSenderId: "23168988354",
  appId: "1:23168988354:web:bd1cf85aeec5b0df36f75b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://api.sistemaderiego.online";
const valvesContainer = document.getElementById("valves-container");
const loginForm = document.getElementById("login-form");

// --- Función de login con Firebase ---
window.login = async function(email, password) {
  console.log("[DEBUG] Intentando login:", email);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("[DEBUG] Login exitoso");
    loginForm.style.display = "none";
    valvesContainer.parentElement.style.display = "block";
    loadStatus();
  } catch (error) {
    console.error("[DEBUG] Error login:", error);
    alert("Error en login: " + error.message);
  }
};

// --- CREAR TARJETAS DE VÁLVULAS ---
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
      <label>Inicio:</label>
      <input type="time" id="start-${id}">
      <label>Fin:</label>
      <input type="time" id="end-${id}">
      <button onclick="scheduleValve(${id})">Programar</button>
    </div>
  `;

  valvesContainer.appendChild(card);
}

// --- CARGAR ESTADO INICIAL ---
async function loadStatus() {
  try {
    console.log("[DEBUG] Cargando estado de válvulas...");
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) throw new Error("Error al obtener estado");
    const data = await res.json();
    valvesContainer.innerHTML = "";
    for (let id = 1; id <= 12; id++) {
      createValveCard(id, data[id]);
    }
    console.log("[DEBUG] Estado cargado:", data);
  } catch (e) {
    console.error("[DEBUG] No se pudo cargar el estado:", e);
    valvesContainer.innerHTML = "<p style='color:red;'>Error conectando al backend</p>";
  }
}

// --- ENCENDER / APAGAR ---
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  console.log(`[DEBUG] Toggle válvula ${id}, endpoint: ${endpoint}`);
  try {
    await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
    loadStatus();
  } catch (e) {
    console.error("[DEBUG] Error toggleValve:", e);
  }
}

// --- PROGRAMAR VÁLVULA POR HORAS ---
async function scheduleValve(id) {
  const start = document.getElementById(`start-${id}`).value;
  const end = document.getElementById(`end-${id}`).value;

  if (!start || !end) return alert("Ingresa hora de inicio y fin");

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  console.log(`[DEBUG] Programando válvula ${id}: ${startH}:${startM} -> ${endH}:${endM}`);

  try {
    const res = await fetch(`${API_URL}/valve/${id}/schedule_hours?startH=${startH}&startM=${startM}&endH=${endH}&endM=${endM}`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Error al programar válvula");
    alert(`Válvula ${id} programada de ${start} a ${end}`);
    loadStatus();
  } catch (e) {
    console.error("[DEBUG] Error scheduleValve:", e);
  }
}

// --- CARGAR AL INICIO ---
loadStatus();


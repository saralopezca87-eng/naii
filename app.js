// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// --- Configuración de Firebase ---
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

// --- API ---
const API_URL = "https://api.sistemaderiego.online";

const valvesContainer = document.getElementById("valves-container");

// --- LOGIN ---
window.login = async function(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("login-form").style.display = "none";
    document.querySelector("main").style.display = "block";
    loadStatus();
  } catch (e) {
    alert("Error de login: " + e.message);
  }
}

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

// --- CARGAR ESTADO ---
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

// --- ENCENDER / APAGAR ---
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  await fetch(`${API_URL}/valve/${id}/${endpoint}`, {
    method: "POST"
  });

  loadStatus();
}

// --- PROGRAMAR VÁLVULA POR HORAS ---
async function scheduleValve(id) {
  const start = document.getElementById(`start-${id}`).value;
  const end = document.getElementById(`end-${id}`).value;

  if (!start || !end) return alert("Ingresa hora de inicio y fin");

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  await fetch(`${API_URL}/valve/${id}/schedule_hours?startH=${startH}&startM=${startM}&endH=${endH}&endM=${endM}`, {
    method: "POST"
  });

  alert(`Válvula ${id} programada de ${start} a ${end}`);
  loadStatus();
}

// --- CARGAR AL INICIO ---
loadStatus();

// app.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

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

// URL del backend
const API_URL = "https://api.sistemaderiego.online";

const valvesContainer = document.getElementById("valves-container");
const loginForm = document.getElementById("login-form");

// --- LOGIN ---
function login(email, password) {
  console.log("[DEBUG] Intentando login:", email);
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log("[DEBUG] Login exitoso:", userCredential.user.email);
      loginForm.style.display = "none";
      valvesContainer.style.display = "grid";
      loadStatus();
    })
    .catch(error => {
      console.error("[ERROR] Login fallido:", error);
      alert("Login fallido: " + error.message);
    });
}

// Detectar estado de autenticación
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("[DEBUG] Usuario ya logueado:", user.email);
    loginForm.style.display = "none";
    valvesContainer.style.display = "grid";
    loadStatus();
  } else {
    console.log("[DEBUG] No hay usuario logueado");
    loginForm.style.display = "block";
    valvesContainer.style.display = "none";
  }
});

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
      <label>Desde: <input type="time" id="start-${id}"></label>
      <label>Hasta: <input type="time" id="end-${id}"></label>
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
    console.error("[ERROR] No se pudo cargar el estado:", e);
    valvesContainer.innerHTML = "<p style='color:red;'>Error conectando al backend</p>";
  }
}

// --- ENCENDER / APAGAR ---
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  console.log(`[DEBUG] Toggle válvula ${id} -> ${endpoint}`);
  try {
    const res = await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
    if (!res.ok) throw new Error("Error al cambiar estado");
    loadStatus();
  } catch (e) {
    console.error(`[ERROR] Toggle válvula ${id} fallido:`, e);
  }
}

// --- PROGRAMAR VÁLVULA POR HORAS ---
async function scheduleValve(id) {
  const start = document.getElementById(`start-${id}`).value;
  const end = document.getElementById(`end-${id}`).value;

  if (!start || !end) return alert("Ingresa horas válidas");
  console.log(`[DEBUG] Programando válvula ${id} desde ${start} hasta ${end}`);

  try {
    const res = await fetch(`${API_URL}/valve/${id}/schedule_hours?start=${start}&end=${end}`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Error al programar válvula");
    alert(`Válvula ${id} programada de ${start} a ${end}`);
    loadStatus();
  } catch (e) {
    console.error(`[ERROR] Programación válvula ${id} fallida:`, e);
    alert("No se pudo programar la válvula");
  }
}

// --- CARGAR AL INICIO ---
window.onload = () => {
  console.log("[DEBUG] Página cargada");
  loadStatus();
};

window.toggleValve = toggleValve;
window.scheduleValve = scheduleValve;
window.login = login;


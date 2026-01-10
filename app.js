// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQJfBPBGFo8IujYZeNK3kr6EiX9xCGvdU",
  authDomain: "sistemaderiego-8950d.firebaseapp.com",
  projectId: "sistemaderiego-8950d",
  storageBucket: "sistemaderiego-8950d.appspot.com",
  messagingSenderId: "23168988354",
  appId: "1:23168988354:web:bd1cf85aeec5b0df36f75b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://api.sistemaderiego.online";
const valvesContainer = document.getElementById("valves-container");
const loginForm = document.getElementById("login-form");

// --- Login ---
window.login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Error de login: " + err.message);
  }
};

// Mostrar válvulas solo si el usuario está logueado
onAuthStateChanged(auth, user => {
  if (user) {
    loginForm.style.display = "none";
    valvesContainer.style.display = "grid";
    loadStatus();
  } else {
    loginForm.style.display = "block";
    valvesContainer.style.display = "none";
  }
});

// --- Crear tarjetas de válvulas ---
function createValveCard(id, state) {
  const card = document.createElement("div");
  card.classList.add("valve-card");
  if (state) card.classList.add("active");
  card.id = `valve-${id}`;

  card.innerHTML = `
    <h2>Válvula ${id}</h2>
    <p>Estado: <span class="state-text">${state ? "ON" : "OFF"}</span></p>
    <button onclick="toggleValve(${id})">${state ? "Apagar" : "Encender"}</button>
    <div class="schedule-inputs">
      <input type="time" id="start-${id}" placeholder="Inicio">
      <input type="time" id="end-${id}" placeholder="Fin">
    </div>
    <button onclick="scheduleValve(${id})">Programar</button>
  `;

  valvesContainer.appendChild(card);
}

// --- Cargar estado inicial ---
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

// --- Encender / Apagar ---
window.toggleValve = async (id) => {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
  loadStatus();
};

// --- Programar válvula por intervalo de horas ---
window.scheduleValve = async (id) => {
  const startTime = document.getElementById(`start-${id}`).value;
  const endTime = document.getElementById(`end-${id}`).value;

  if (!startTime || !endTime) return alert("Ingresa ambos horarios");

  await fetch(`${API_URL}/valve/${id}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: startTime, end: endTime })
  });

  alert(`Válvula ${id} programada de ${startTime} a ${endTime}`);
  loadStatus();
};

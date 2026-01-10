// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

console.log("Script cargado");

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQJfBPBGFo8IujYZeNK3kr6EiX9xCGvdU",
  authDomain: "sistemaderiego-8950d.firebaseapp.com",
  projectId: "sistemaderiego-8950d",
  storageBucket: "sistemaderiego-8950d.firebasestorage.app",
  messagingSenderId: "23168988354",
  appId: "1:23168988354:web:bd1cf85aeec5b0df36f75b"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase inicializado:", app);

const auth = getAuth(app);

const API_URL = "https://api.sistemaderiego.online";

const loginForm = document.getElementById("login-form");
const loginError = document.createElement("p");
loginError.style.color = "red";
loginError.style.display = "none";
loginForm.appendChild(loginError);

const valvesContainer = document.getElementById("valves-container");

// --- Login ---
function login(email, password) {
  console.log("Intentando login con:", email, password);
  loginError.style.display = "none";

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Login exitoso:", userCredential.user);
      loginForm.style.display = "none";
      document.querySelector("main").style.display = "block";
      loadStatus();
    })
    .catch((err) => {
      console.error("Error en login:", err);
      loginError.textContent = "Error en login: " + err.message;
      loginError.style.display = "block";
    });
}

// Detectar cambios de sesión
onAuthStateChanged(auth, (user) => {
  console.log("Estado de autenticación cambiado:", user);
  if (user) {
    loginForm.style.display = "none";
    document.querySelector("main").style.display = "block";
    loadStatus();
  } else {
    loginForm.style.display = "block";
    document.querySelector("main").style.display = "none";
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
    <input type="number" id="time-${id}" placeholder="Segundos">
    <button onclick="scheduleValve(${id})">Programar</button>
  `;

  valvesContainer.appendChild(card);
}

// --- Cargar estado ---
async function loadStatus() {
  try {
    console.log("Cargando estado de válvulas...");
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) throw new Error("Error al obtener estado");
    const data = await res.json();
    console.log("Estado recibido:", data);
    valvesContainer.innerHTML = "";
    for (let id = 1; id <= 12; id++) {
      createValveCard(id, data[id]);
    }
  } catch (e) {
    console.error("No se pudo cargar el estado:", e);
    valvesContainer.innerHTML = "<p style='color:red;'>Error conectando al backend</p>";
  }
}

// --- Encender / apagar ---
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  console.log(`Intentando ${endpoint} válvula ${id}`);
  try {
    const res = await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
    if (!res.ok) throw new Error("Error en toggleValve");
    console.log(`Válvula ${id} ${endpoint} ejecutada`);
    loadStatus();
  } catch (e) {
    console.error("Error toggleValve:", e);
  }
}

// --- Programar válvula ---
async function scheduleValve(id) {
  const seconds = parseInt(document.getElementById(`time-${id}`).value);
  if (!seconds || seconds <= 0) return alert("Ingresa segundos válidos");

  console.log(`Programando válvula ${id} por ${seconds} segundos`);
  try {
    const res = await fetch(`${API_URL}/valve/${id}/schedule?seconds=${seconds}`, { method: "POST" });
    if (!res.ok) throw new Error("Error en scheduleValve");
    alert(`Válvula ${id} programada por ${seconds} segundos`);
    loadStatus();
  } catch (e) {
    console.error("Error scheduleValve:", e);
  }
}

// --- Cargar al inicio ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("Documento cargado");
  document.querySelector("main").style.display = "none"; // ocultar hasta login
});

// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQJfBPBGFo8IujYZeNK3kr6EiX9xCGvdU",
  authDomain: "sistemaderiego-8950d.firebaseapp.com",
  projectId: "sistemaderiego-8950d",
  storageBucket: "sistemaderiego-8950d.firebasestorage.app",
  messagingSenderId: "23168988354",
  appId: "1:23168988354:web:bd1cf85aeec5b0df36f75b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const valvesContainer = document.getElementById("valves-container");
const loginForm = document.getElementById("login-form");
const btnLogin = document.getElementById("btn-login");

// FUNCION LOGIN
function login(email, password) {
  console.log("Intentando login con:", email, password);
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Login exitoso:", userCredential.user);
      loginForm.style.display = "none"; // Ocultar login
      valvesContainer.style.display = "grid"; // Mostrar válvulas
      loadStatus(); // Cargar estado inicial
    })
    .catch((error) => {
      console.error("Error en login:", error.code, error.message);
      alert("Error de login: " + error.message);
    });
}

// Evento click del botón Entrar
btnLogin.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  login(email, password);
});

// --- FUNCIONES DE VÁLVULAS ---
const API_URL = "https://api.sistemaderiego.online";

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

// Cargar estado inicial
async function loadStatus() {
  try {
    console.log("Cargando estado de válvulas...");
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

// Encender / Apagar
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  try {
    console.log(`Enviando request a válvula ${id}: ${endpoint}`);
    await fetch(`${API_URL}/valve/${id}/${endpoint}`, {
      method: "POST"
    });
    loadStatus();
  } catch (e) {
    console.error("Error al togglear válvula:", e);
  }
}

// Programar válvula
async function scheduleValve(id) {
  const seconds = parseInt(document.getElementById(`time-${id}`).value);
  if (!seconds || seconds <= 0) return alert("Ingresa segundos válidos");

  try {
    console.log(`Programando válvula ${id} por ${seconds} segundos`);
    await fetch(`${API_URL}/valve/${id}/schedule?seconds=${seconds}`, {
      method: "POST"
    });
    alert(`Válvula ${id} programada por ${seconds} segundos`);
    loadStatus();
  } catch (e) {
    console.error("Error al programar válvula:", e);
  }
}

// Exponer funciones globalmente si es necesario
window.toggleValve = toggleValve;
window.scheduleValve = scheduleValve;


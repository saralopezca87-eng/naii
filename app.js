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

// ---------------------------------
// LOGIN CON FIREBASE
// ---------------------------------
window.login = async function(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario logueado:", userCredential.user.email);
    document.getElementById("login-form").style.display = "none";
    loadStatus();
  } catch (error) {
    console.error("Error de login:", error.message);
    alert("Usuario o contraseña incorrectos");
  }
}

// ---------------------------------
// CREAR TARJETAS DE VÁLVULAS
// ---------------------------------
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
      <label>Inicio: <input type="time" id="start-${id}"></label>
      <label>Fin: <input type="time" id="end-${id}"></label>
      <button onclick="scheduleValve(${id})">Programar</button>
    </div>
  `;

  valvesContainer.appendChild(card);
}

// ---------------------------------
// CARGAR ESTADO INICIAL
// ---------------------------------
async function loadStatus() {
  try {
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) throw new Error("Error al obtener estado");
    const data = await res.json();
    valvesContainer.innerHTML = "";
    for (let id = 1; id <= 12; id++) {
      createValveCard(id, data[id]);
    }
    console.log("Estado de válvulas cargado:", data);
  } catch (e) {
    console.error("No se pudo cargar el estado:", e);
    valvesContainer.innerHTML = "<p style='color:red;'>Error conectando al backend</p>";
  }
}

// ---------------------------------
// ENCENDER / APAGAR
// ---------------------------------
async function toggleValve(id) {
  const card = document.getElementById(`valve-${id}`);
  const state = card.classList.contains("active");
  const endpoint = state ? "off" : "on";

  console.log(`Toggle válvula ${id}, acción: ${endpoint}`);

  try {
    await fetch(`${API_URL}/valve/${id}/${endpoint}`, { method: "POST" });
    loadStatus();
  } catch (e) {
    console.error("Error al cambiar estado de válvula:", e);
  }
}

// ---------------------------------
// PROGRAMAR VÁLVULA POR HORAS
// ---------------------------------
async function scheduleValve(id) {
  const startInput = document.getElementById(`start-${id}`).value;
  const endInput = document.getElementById(`end-${id}`).value;

  if (!startInput || !endInput) {
    return alert("Ingresa hora de inicio y fin válidas");
  }

  const [startHour, startMinute] = startInput.split(":").map(Number);
  const [endHour, endMinute] = endInput.split(":").map(Number);

  console.log(`Programando válvula ${id} de ${startHour}:${startMinute} a ${endHour}:${endMinute}`);

  try {
    const res = await fetch(`${API_URL}/valve/${id}/schedule_hours`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_hour: startHour, start_minute: startMinute, end_hour: endHour, end_minute: endMinute })
    });
    if (!res.ok) throw new Error("Error en el backend al programar");

    alert(`Válvula ${id} programada: ${startHour}:${startMinute} → ${endHour}:${endMinute}`);
    loadStatus();
  } catch (e) {
    console.error("Error al programar válvula:", e);
    alert("No se pudo programar la válvula");
  }
}

// ---------------------------------
// CARGAR AL INICIO
// ---------------------------------
loadStatus();


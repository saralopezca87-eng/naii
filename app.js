// app.js
console.log("app.js cargado correctamente");
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
let currentUserToken = null;
function login(email, password) {
  console.log("Intentando login con:", email, password);
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      console.log("Login exitoso:", userCredential.user);
      loginForm.style.display = "none"; // Ocultar login
      valvesContainer.style.display = "grid"; // Mostrar válvulas
      // Obtener el token de Firebase
      currentUserToken = await userCredential.user.getIdToken();
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
    <div style="margin-top:8px; display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
      <div>
        <label>Fecha inicio: <input type="date" id="start-date-${id}"></label>
        <label>Hora inicio: <input type="time" id="start-${id}"></label>
      </div>
      <div>
        <label>Fecha fin: <input type="date" id="end-date-${id}"></label>
        <label>Hora fin: <input type="time" id="end-${id}"></label>
      </div>
      <button onclick="scheduleValve(${id})">Programar</button>
    </div>
  `;

  valvesContainer.appendChild(card);
}

// Cargar estado inicial
async function loadStatus() {
  try {
    console.log("Cargando estado de válvulas...");
    const headers = currentUserToken ? { "Authorization": `Bearer ${currentUserToken}` } : {};
    const res = await fetch(`${API_URL}/status`, { headers });
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
    const headers = currentUserToken ? { "Authorization": `Bearer ${currentUserToken}` } : {};
    await fetch(`${API_URL}/valve/${id}/${endpoint}`, {
      method: "POST",
      headers
    });
    loadStatus();
  } catch (e) {
    console.error("Error al togglear válvula:", e);
  }
}

// Programar válvula (ahora con fecha y hora)
async function scheduleValve(id) {
  const startDate = document.getElementById(`start-date-${id}`).value;
  const startTime = document.getElementById(`start-${id}`).value;
  const endDate = document.getElementById(`end-date-${id}`).value;
  const endTime = document.getElementById(`end-${id}`).value;
  if (!startDate || !startTime || !endDate || !endTime) return alert("Debes ingresar fecha y hora de inicio y fin");

  // Unir fecha y hora en formato ISO
  const start = `${startDate}T${startTime}`;
  const end = `${endDate}T${endTime}`;

  try {
    console.log(`Programando válvula ${id} de ${start} a ${end}`);
    const headers = {
      "Content-Type": "application/json"
    };
    if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
    // Por ahora seguimos usando el endpoint actual, luego se adaptará el backend
    const response = await fetch(`${API_URL}/valve/${id}/schedule_hours`, {
      method: "POST",
      headers,
      body: JSON.stringify({ start, end })
    });
    if (!response.ok) {
      let errorMsg = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMsg += ":\n" + errorData.detail.map(e => (e.msg ? e.msg : JSON.stringify(e))).join("\n");
          } else {
            errorMsg += ": " + errorData.detail;
          }
        } else {
          errorMsg += ": " + JSON.stringify(errorData);
        }
      } catch (err) {
        errorMsg += ": No se pudo leer el mensaje de error del backend.";
      }
      alert(`No se pudo programar la válvula: ${errorMsg}`);
      console.error("Error al programar válvula:", errorMsg);
      return;
    }
    alert(`Válvula ${id} programada de ${start} a ${end}`);
    loadStatus();
  } catch (e) {
    console.error("Error al programar válvula:", e);
    alert("Error inesperado al programar válvula: " + e.message);
  }
}

// Exponer funciones globalmente si es necesario
window.toggleValve = toggleValve;
window.scheduleValve = scheduleValve;


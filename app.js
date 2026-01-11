// --- Mostrar contenido interno tras login ---
function showInternalContent() {
  // Mostrar válvulas y controles del sistema
  if (valvesContainer) valvesContainer.style.display = "grid";
  const systemControls = document.getElementById("system-controls");
  if (systemControls) systemControls.style.display = "flex";
  setupSystemControls();
}
// --- REINICIO DE RASPBERRY ---

const btnReboot = document.getElementById("btn-reboot");
const btnShutdown = document.getElementById("btn-shutdown");
const btnPowerOn = document.getElementById("btn-poweron");

  if (btnReboot) {
    btnReboot.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas reiniciar el sistema? Esto tomará unos minutos.")) return;
      btnReboot.disabled = true;
      btnReboot.textContent = "Reiniciando...";
      await updateApiUrl();
      if (!API_URL) {
        alert("No se pudo obtener la IP de la Raspberry Pi. Intenta más tarde.");
        btnReboot.disabled = false;
        btnReboot.textContent = "Reiniciar sistema";
        return;
      }
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/reboot`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está reiniciando. Espera 3 minutos para efectuar tu programación.");
        } else {
          alert("No se pudo reiniciar el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar reiniciar el sistema: " + e.message);
      }
      setTimeout(() => {
        btnReboot.disabled = false;
        btnReboot.textContent = "Reiniciar sistema";
      }, 20000);
    });
  }

  if (btnShutdown) {
    btnShutdown.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas apagar el sistema?")) return;
      btnShutdown.disabled = true;
      btnShutdown.textContent = "Apagando...";
      await updateApiUrl();
      if (!API_URL) {
        alert("No se pudo obtener la IP de la Raspberry Pi. Intenta más tarde.");
        btnShutdown.disabled = false;
        btnShutdown.textContent = "Apagar sistema";
        return;
      }
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/shutdown`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está apagando. Para volver a encenderlo, hazlo manualmente o usa el botón 'Encender sistema' si está disponible.");
        } else {
          alert("No se pudo apagar el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar apagar el sistema: " + e.message);
      }
      setTimeout(() => {
        btnShutdown.disabled = false;
        btnShutdown.textContent = "Apagar sistema";
      }, 20000);
    });
  }

  if (btnPowerOn) {
    btnPowerOn.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas encender el sistema? (Solo funciona si hay hardware de encendido remoto)")) return;
      btnPowerOn.disabled = true;
      btnPowerOn.textContent = "Encendiendo...";
      await updateApiUrl();
      if (!API_URL) {
        alert("No se pudo obtener la IP de la Raspberry Pi. Intenta más tarde.");
        btnPowerOn.disabled = false;
        btnPowerOn.textContent = "Encender sistema";
        return;
      }
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/poweron`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está encendiendo (si el hardware lo permite).");
        } else {
          alert("No se pudo encender el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar encender el sistema: " + e.message);
      }
      setTimeout(() => {
        btnPowerOn.disabled = false;
        btnPowerOn.textContent = "Encender sistema";
      }, 20000);
    });
  }
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
      showInternalContent();
      // Obtener el token de Firebase
      currentUserToken = await userCredential.user.getIdToken();
      loadStatus(); // Cargar estado inicial
      // Iniciar refresco automático del estado cada 30 segundos
      if (!window._valveStatusInterval) {
        window._valveStatusInterval = setInterval(loadStatus, 30000);
      }
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
// Endpoint de la Raspberry Pi para obtener su IP pública
const RASPBERRY_API_URL = "http://localhost:8000/get-public-ip";
let API_URL = "http://localhost:8000";

async function updateApiUrl() {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API_URL = "http://localhost:8000";
  } else {
    try {
      // Suponiendo que el frontend ya se comunica con la Raspberry Pi
      const res = await fetch(RASPBERRY_API_URL);
      const data = await res.json();
      if (data.ip) {
        API_URL = `http://${data.ip}:8000`;
      } else {
        API_URL = "";
      }
    } catch {
      API_URL = "";
    }
  }
}

// Llamar updateApiUrl al cargar la página y antes de usar los botones
updateApiUrl();

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
  // ...lógica existente...
}

// --- Controles del sistema ---
function setupSystemControls() {
  const btnReboot = document.getElementById("btn-reboot");
  const btnShutdown = document.getElementById("btn-shutdown");
  const btnPowerOn = document.getElementById("btn-poweron");

  if (btnReboot) {
    btnReboot.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas reiniciar el sistema? Esto tomará unos minutos.")) return;
      btnReboot.disabled = true;
      btnReboot.textContent = "Reiniciando...";
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/reboot`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está reiniciando. Espera 3 minutos para efectuar tu programación.");
        } else {
          alert("No se pudo reiniciar el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar reiniciar el sistema: " + e.message);
      }
      setTimeout(() => {
        btnReboot.disabled = false;
        btnReboot.textContent = "Reiniciar sistema";
      }, 20000);
    });
  }

  if (btnShutdown) {
    btnShutdown.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas apagar el sistema?")) return;
      btnShutdown.disabled = true;
      btnShutdown.textContent = "Apagando...";
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/shutdown`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está apagando. Para volver a encenderlo, hazlo manualmente o usa el botón 'Encender sistema' si está disponible.");
        } else {
          alert("No se pudo apagar el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar apagar el sistema: " + e.message);
      }
      setTimeout(() => {
        btnShutdown.disabled = false;
        btnShutdown.textContent = "Apagar sistema";
      }, 20000);
    });
  }

  if (btnPowerOn) {
    btnPowerOn.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas encender el sistema? (Solo funciona si hay hardware de encendido remoto)")) return;
      btnPowerOn.disabled = true;
      btnPowerOn.textContent = "Encendiendo...";
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUserToken) headers["Authorization"] = `Bearer ${currentUserToken}`;
        const res = await fetch(`${API_URL}/poweron`, { method: "POST", headers });
        if (res.ok) {
          alert("El sistema se está encendiendo (si el hardware lo permite).");
        } else {
          alert("No se pudo encender el sistema. Intenta manualmente.");
        }
      } catch (e) {
        alert("Error al intentar encender el sistema: " + e.message);
      }
      setTimeout(() => {
        btnPowerOn.disabled = false;
        btnPowerOn.textContent = "Encender sistema";
      }, 20000);
    });
  }
}
}


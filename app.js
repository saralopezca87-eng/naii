
// --- Mostrar contenido interno tras login ---
function showInternalContent() {
  if (valvesContainer) valvesContainer.style.display = "grid";
  const systemControls = document.getElementById("system-controls");
  if (systemControls) systemControls.style.display = "flex";
  setupSystemControls();
}

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
}



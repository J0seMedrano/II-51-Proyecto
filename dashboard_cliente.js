/* ---- Leer sesión desde localStorage ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));

// Si no hay sesión activa, redirigir al login
if (!usuario) {
  window.location.href = "login.html";
}

/* ---- Mostrar nombre del usuario en la navbar y saludo ---- */
document.getElementById("navNombreUsuario").textContent = "👤 " + usuario.nombre;
document.getElementById("saludo").textContent = "Bienvenido, " + usuario.nombre + " 👋";

/* ---- Cerrar sesión ---- */
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
});

/* ---- Copiar dirección al portapapeles ---- */
function copiarDireccion() {
  const direccion = document.getElementById("direccionCasillero").textContent.trim();
  navigator.clipboard.writeText(direccion).then(() => {
    const btn = document.querySelector(".dashboard-address-banner .btn");
    btn.textContent = "✅ Copiado";
    setTimeout(() => {
      btn.textContent = "📋 Copiar dirección";
    }, 2000);
  });
}

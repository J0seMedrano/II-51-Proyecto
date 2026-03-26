/* ---- Proteger pagina: requiere sesion activa ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  window.location.href = "login.html";
}

/* ---- Cerrar sesion ---- */
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
});

/* ---- Helper de formato de fecha ---- */
function formatearFecha(timestamp) {
  if (!timestamp) return "—";
  const fecha = new Date(timestamp);
  return fecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ---- Obtener iniciales para el avatar ---- */
function obtenerIniciales(nombre) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(" ");
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return partes[0][0].toUpperCase();
}

/* ---- Llenar la pagina con los datos del localStorage ---- */
function cargarDatosCuenta() {

  // Avatar con iniciales
  document.getElementById("cuentaAvatar").textContent = obtenerIniciales(usuario.nombre);

  // Header del perfil
  document.getElementById("cuentaNombre").textContent        = usuario.nombre   || "—";
  document.getElementById("cuentaCorreoHeader").textContent  = usuario.correo   || "—";

  // Badge de estado
  const estadoBadge = document.getElementById("cuentaEstadoBadge");
  if (usuario.estado) {
    estadoBadge.textContent = "Activa";
    estadoBadge.classList.add("badge-entregado");
  } else {
    estadoBadge.textContent = "Inactiva";
    estadoBadge.classList.add("badge-transito");
  }

  // Informacion personal
  document.getElementById("cuentaNombreDetalle").textContent = usuario.nombre    || "—";
  document.getElementById("cuentaCorreo").textContent        = usuario.correo    || "—";
  document.getElementById("cuentaTelefono").textContent      = usuario.telefono  || "No registrado";
  document.getElementById("cuentaDireccion").textContent     = usuario.direccion || "No registrada";

  // Informacion de la cuenta
  document.getElementById("cuentaFechaRegistro").textContent = formatearFecha(usuario.fecha_registro);
  document.getElementById("cuentaEstado").textContent        = usuario.estado ? "Activa" : "Inactiva";
  document.getElementById("cuentaId").textContent            = "CLI-" + String(usuario.id_usuario).padStart(5, "0");
}

/* ---- Iniciar ---- */
cargarDatosCuenta();

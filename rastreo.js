import { supabase } from "./supabase.js";

/* ---- Protección de sesión ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  window.location.href = "login.html";
}

/* ---- Cerrar sesión ---- */
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
});

/* ---- Helpers ---- */
function formatearFecha(timestamp) {
  if (!timestamp) return "Pendiente";
  const fecha = new Date(timestamp);
  return fecha.toLocaleDateString("es-CR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function obtenerEstado(edo) {
  const estados = {
    "en_transito": { texto: "En tránsito",  icono: "🚚" },
    "recibido":    { texto: "Recibido",      icono: "📬" },
    "entregado":   { texto: "Entregado",     icono: "✅" }
  };
  return estados[edo] || { texto: edo, icono: "📦" };
}

function construirHistorial(paquete) {
  const pasos = [
    {
      clave:   "pre-alertado",
      label:   "Pre-alertado",
      fecha:   paquete.fecha_prealerta,
      icono:   "📋",
      activo:  !!paquete.fecha_prealerta
    },
    {
      clave:   "recibido",
      label:   "Recibido en casillero",
      fecha:   paquete.fecha_recepcion,
      icono:   "📬",
      activo:  !!paquete.fecha_recepcion
    },
    {
      clave:   "en_transito",
      label:   "En tránsito",
      fecha:   null,
      icono:   "🚚",
      activo:  ["en_transito", "entregado"].includes(paquete.edo_paquete)
    },
    {
      clave:   "entregado",
      label:   "Entregado",
      fecha:   paquete.fecha_entrega,
      icono:   "✅",
      activo:  paquete.edo_paquete === "entregado"
    }
  ];

  return pasos.map(paso => `
    <div class="rastreo-paso ${paso.activo ? "rastreo-paso-activo" : "rastreo-paso-inactivo"}">
      <div class="rastreo-paso-icono">${paso.icono}</div>
      <div class="rastreo-paso-info">
        <p class="rastreo-paso-label">${paso.label}</p>
        ${paso.fecha
          ? `<p class="rastreo-paso-fecha">${formatearFecha(paso.fecha)}</p>`
          : paso.activo
            ? `<p class="rastreo-paso-fecha">En proceso</p>`
            : `<p class="rastreo-paso-fecha text-muted">Pendiente</p>`
        }
      </div>
    </div>
  `).join("");
}

/* ---- Submit del formulario ---- */
const form = document.getElementById("formRastreo");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Limpiar resultados previos
  document.getElementById("mensajeRastreo").innerHTML = "";
  document.getElementById("resultadoRastreo").classList.add("d-none");

  const guia = document.getElementById("guia").value.trim();

  if (!guia) {
    document.getElementById("mensajeRastreo").innerHTML =
      "<div class='alert alert-warning'>Por favor ingresa un número de guía.</div>";
    return;
  }

  // Deshabilitar botón mientras busca
  const btn = document.getElementById("btnRastrear");
  btn.disabled = true;
  btn.textContent = "Buscando...";

  // Consultar en Supabase — busca el paquete por guía
  // y verifica que pertenezca al usuario en sesión
  const { data, error } = await supabase
    .from("paquetes")
    .select("*")
    .eq("guia_paquete", guia)
    .eq("id_usuario", usuario.id_usuario)
    .single();

  btn.disabled = false;
  btn.textContent = "Rastrear";

  if (error || !data) {
    document.getElementById("mensajeRastreo").innerHTML =
      "<div class='alert alert-danger'>No se encontró ningún paquete con ese número de guía asociado a tu cuenta.</div>";
    return;
  }

  // Llenar estado visual
  const estado = obtenerEstado(data.edo_paquete);
  document.getElementById("estadoIcono").textContent = estado.icono;
  document.getElementById("estadoTexto").textContent  = estado.texto;

  // Llenar detalle
  document.getElementById("detalleGuia").textContent        = data.guia_paquete;
  document.getElementById("detalleDescripcion").textContent = data.descripcion_paquete || "Sin descripción";
  document.getElementById("detallePeso").textContent        = data.peso_paquete ? data.peso_paquete + " kg" : "—";
  document.getElementById("detalleDimensiones").textContent =
    (data.largo_paquete && data.ancho_paquete && data.alto_paquete)
      ? `${data.largo_paquete} × ${data.ancho_paquete} × ${data.alto_paquete}`
      : "—";
  document.getElementById("detalleFechaRecepcion").textContent = formatearFecha(data.fecha_recepcion);
  document.getElementById("detalleFechaEntrega").textContent   = formatearFecha(data.fecha_entrega);
  document.getElementById("detalleMonto").textContent =
    data.monto_cancelado ? "$" + data.monto_cancelado.toFixed(2) : "Pendiente";

  // Llenar historial
  document.getElementById("historialEstados").innerHTML = construirHistorial(data);

  // Mostrar sección de resultado
  document.getElementById("resultadoRastreo").classList.remove("d-none");

});

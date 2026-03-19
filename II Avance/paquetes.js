import { supabase } from "./supabase.js";

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

/* ---- Variable global para guardar todos los paquetes ---- */
let todosPaquetes = [];

/* ---- Helpers ---- */
function formatearFecha(timestamp) {
  if (!timestamp) return "—";
  const fecha = new Date(timestamp);
  return fecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function badgeEstado(estado) {
  const estados = {
    en_transito: { label: "En transito",  clase: "badge-transito"  },
    recibido:    { label: "Recibido",     clase: "badge-recibido"  },
    entregado:   { label: "Entregado",    clase: "badge-entregado" }
  };
  const s = estados[estado] || { label: estado, clase: "bg-secondary" };
  return `<span class="badge-estado ${s.clase}">${s.label}</span>`;
}

/* ---- Renderizar lista de paquetes ---- */
function renderizarPaquetes(paquetes) {
  const container = document.getElementById("listaPaquetes");

  if (!paquetes || paquetes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <p class="fw-bold fs-5 mb-1">Sin paquetes registrados</p>
        <p class="text-muted small">No tienes paquetes con este estado en tu casillero.</p>
      </div>
    `;
    return;
  }

  const tarjetas = paquetes.map(p => `
    <div class="paquete-card" onclick="verDetalle(${p.id_paquete})">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <p class="fw-bold mb-0" style="color:var(--color-primary-dark)">${p.descripcion_paquete || "Sin descripcion"}</p>
          <p class="text-muted small mb-0">Guia: <code>${p.guia_paquete}</code></p>
        </div>
        ${badgeEstado(p.edo_paquete)}
      </div>
      <div class="row g-2">
        <div class="col-6 col-md-3">
          <p class="paquete-label">Peso</p>
          <p class="paquete-valor">${p.peso_paquete ? p.peso_paquete + " kg" : "—"}</p>
        </div>
        <div class="col-6 col-md-3">
          <p class="paquete-label">Fecha recepcion</p>
          <p class="paquete-valor">${formatearFecha(p.fecha_recepcion)}</p>
        </div>
        <div class="col-6 col-md-3">
          <p class="paquete-label">Fecha entrega</p>
          <p class="paquete-valor">${formatearFecha(p.fecha_entrega)}</p>
        </div>
        <div class="col-6 col-md-3">
          <p class="paquete-label">Monto cancelado</p>
          <p class="paquete-valor">${p.monto_cancelado ? "$" + parseFloat(p.monto_cancelado).toFixed(2) : "—"}</p>
        </div>
      </div>
      <p class="paquete-ver-detalle mt-2 mb-0">Ver detalle completo &rarr;</p>
    </div>
  `).join("");

  container.innerHTML = tarjetas;
}

/* ---- Ver detalle en modal ---- */
window.verDetalle = function (idPaquete) {
  const p = todosPaquetes.find(x => x.id_paquete === idPaquete);
  if (!p) return;

  document.getElementById("modalDetalleLabel").textContent = p.guia_paquete;
  document.getElementById("modalDetalleBody").innerHTML = `

    <div class="mb-4">
      <div class="d-flex align-items-center gap-3 mb-3">
        <div>
          <p class="text-muted small mb-1">Estado actual</p>
          ${badgeEstado(p.edo_paquete)}
        </div>
      </div>
    </div>

    <div class="row g-3">

      <div class="col-12">
        <p class="paquete-label">Descripcion</p>
        <p class="paquete-valor">${p.descripcion_paquete || "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Peso</p>
        <p class="paquete-valor">${p.peso_paquete ? p.peso_paquete + " kg" : "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Largo</p>
        <p class="paquete-valor">${p.largo_paquete ? p.largo_paquete + " cm" : "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Ancho</p>
        <p class="paquete-valor">${p.ancho_paquete ? p.ancho_paquete + " cm" : "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Alto</p>
        <p class="paquete-valor">${p.alto_paquete ? p.alto_paquete + " cm" : "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Monto cancelado</p>
        <p class="paquete-valor">${p.monto_cancelado ? "$" + parseFloat(p.monto_cancelado).toFixed(2) : "—"}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Fecha pre-alerta</p>
        <p class="paquete-valor">${formatearFecha(p.fecha_prealerta)}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Fecha recepcion</p>
        <p class="paquete-valor">${formatearFecha(p.fecha_recepcion)}</p>
      </div>

      <div class="col-6 col-md-4">
        <p class="paquete-label">Fecha entrega</p>
        <p class="paquete-valor">${formatearFecha(p.fecha_entrega)}</p>
      </div>

    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById("modalDetalle"));
  modal.show();
};

/* ---- Filtros por estado ---- */
document.querySelectorAll(".btn-filtro").forEach(btn => {
  btn.addEventListener("click", function () {
    // Actualizar boton activo
    document.querySelectorAll(".btn-filtro").forEach(b => b.classList.remove("activo"));
    this.classList.add("activo");

    const filtro = this.getAttribute("data-filtro");

    if (filtro === "todos") {
      renderizarPaquetes(todosPaquetes);
    } else {
      const filtrados = todosPaquetes.filter(p => p.edo_paquete === filtro);
      renderizarPaquetes(filtrados);
    }
  });
});

/* ---- Cargar paquetes del usuario desde Supabase ---- */
async function cargarPaquetes() {
  document.getElementById("spinnerPaquetes").style.display = "block";
  document.getElementById("listaPaquetes").innerHTML = "";

  const { data, error } = await supabase
    .from("paquetes")
    .select("*")
    .eq("id_usuario", usuario.id_usuario)
    .order("id_paquete", { ascending: false });

  document.getElementById("spinnerPaquetes").style.display = "none";

  if (error) {
    document.getElementById("listaPaquetes").innerHTML =
      "<div class='alert alert-danger'>Error al cargar los paquetes: " + error.message + "</div>";
    return;
  }

  todosPaquetes = data || [];
  renderizarPaquetes(todosPaquetes);
}

/* ---- Iniciar ---- */
cargarPaquetes();

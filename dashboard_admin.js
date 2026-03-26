import { supabase } from "./supabase.js";

/* ---- Proteger pagina: solo admin ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
const rol     = localStorage.getItem("rol");

if (!usuario || rol !== "admin") {
  window.location.href = "login.html";
}

/* ---- Cerrar sesion ---- */
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  window.location.href = "login.html";
});

/* ---- Helpers ---- */
function formatearFecha(timestamp) {
  if (!timestamp) return "—";
  const f = new Date(timestamp);
  return f.toLocaleDateString("es-CR", {
    year: "numeric", month: "short", day: "numeric"
  });
}

function badgeEstado(estado) {
  const map = {
    en_transito: "<span class='badge-estado badge-transito'>En transito</span>",
    recibido:    "<span class='badge-estado badge-recibido'>Recibido</span>",
    entregado:   "<span class='badge-estado badge-entregado'>Entregado</span>"
  };
  return map[estado] || `<span class='badge bg-secondary'>${estado}</span>`;
}

/* ==================================================
   PASO 1 — Cargar usuarios con pre-alertas pendientes
   ================================================== */
async function cargarUsuariosConPrealertas() {
  document.getElementById("spinnerUsuariosSelect").style.display = "block";
  document.getElementById("listaUsuariosConPrealertas").innerHTML = "";

  // Obtener prealertas pendientes con datos del usuario
  const { data, error } = await supabase
    .from("prealertas")
    .select("id_usuario, usuarios(id_usuario, nombre, correo)")
    .eq("validacion_prealerta", false);

  document.getElementById("spinnerUsuariosSelect").style.display = "none";

  if (error) {
    document.getElementById("listaUsuariosConPrealertas").innerHTML =
      `<div class="alert alert-danger small">Error: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById("listaUsuariosConPrealertas").innerHTML =
      `<p class="text-muted small text-center py-3">No hay pre-alertas pendientes.</p>`;
    return;
  }

  // Deduplicar usuarios
  const usuariosMap = {};
  data.forEach(p => {
    if (p.usuarios && !usuariosMap[p.id_usuario]) {
      usuariosMap[p.id_usuario] = p.usuarios;
    }
  });

  const usuariosUnicos = Object.values(usuariosMap);

  document.getElementById("listaUsuariosConPrealertas").innerHTML = usuariosUnicos.map(u => `
    <div class="admin-usuario-item" id="usuarioItem-${u.id_usuario}"
      onclick="seleccionarUsuario(${u.id_usuario}, '${u.nombre}')">
      <p class="fw-bold mb-0" style="color:var(--color-primary-dark)">${u.nombre}</p>
      <p class="text-muted small mb-0">${u.correo}</p>
    </div>
  `).join("");
}

/* ==================================================
   PASO 2 — Cargar pre-alertas del usuario seleccionado
   ================================================== */
window.seleccionarUsuario = async function (idUsuario, nombreUsuario) {
  // Resaltar usuario seleccionado
  document.querySelectorAll(".admin-usuario-item").forEach(el => el.classList.remove("seleccionado"));
  document.getElementById(`usuarioItem-${idUsuario}`).classList.add("seleccionado");

  // Limpiar paso 3
  document.getElementById("placeholderFormPaquete").style.display = "block";
  document.getElementById("formNuevoPaquete").style.display       = "none";
  document.getElementById("mensajeNuevoPaquete").innerHTML        = "";

  document.getElementById("listaPrelertasUsuario").innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
    </div>
  `;
  document.getElementById("placeholderPrealertas").style.display = "none";

  const { data, error } = await supabase
    .from("prealertas")
    .select("*")
    .eq("id_usuario", idUsuario)
    .eq("validacion_prealerta", false)
    .order("id_prealerta", { ascending: false });

  if (error || !data || data.length === 0) {
    document.getElementById("listaPrelertasUsuario").innerHTML =
      `<p class="text-muted small text-center py-3">Sin pre-alertas pendientes para este usuario.</p>`;
    return;
  }

  document.getElementById("listaPrelertasUsuario").innerHTML = data.map(p => `
    <div class="admin-prealerta-item" id="prealertaItem-${p.id_prealerta}"
      onclick="seleccionarPrealerta(${p.id_prealerta}, ${idUsuario}, '${nombreUsuario}',
        '${p.numero_tracking}', '${p.descripcion_producto.replace(/'/g, "\\'")}',
        ${p.valor_declarado})">
      <p class="fw-bold mb-1" style="color:var(--color-primary-dark); font-size:0.88rem">
        ${p.descripcion_producto}
      </p>
      <p class="text-muted small mb-1">${p.proveedor_tienda}</p>
      <p class="text-muted small mb-0">Tracking: <code>${p.numero_tracking}</code></p>
      <p class="text-muted small mb-0">Valor: $${parseFloat(p.valor_declarado).toFixed(2)}</p>
    </div>
  `).join("");
};

/* ==================================================
   PASO 3 — Prellenar formulario con datos de la pre-alerta
   ================================================== */
window.seleccionarPrealerta = function (idPrealerta, idUsuario, nombreUsuario, tracking, descripcion, valor) {
  // Resaltar pre-alerta seleccionada
  document.querySelectorAll(".admin-prealerta-item").forEach(el => el.classList.remove("seleccionado"));
  document.getElementById(`prealertaItem-${idPrealerta}`).classList.add("seleccionado");

  // Mostrar formulario
  document.getElementById("placeholderFormPaquete").style.display = "none";
  document.getElementById("formNuevoPaquete").style.display       = "block";
  document.getElementById("mensajeNuevoPaquete").innerHTML        = "";

  // Prellenar campos
  document.getElementById("pkgIdUsuario").value    = idUsuario;
  document.getElementById("pkgIdPrealerta").value  = idPrealerta;
  document.getElementById("pkgNombreUsuario").value = nombreUsuario;
  document.getElementById("pkgDescripcion").value  = descripcion;
  document.getElementById("pkgGuia").value         = "";
  document.getElementById("pkgPeso").value         = "";
  document.getElementById("pkgMonto").value        = valor;
  document.getElementById("pkgLargo").value        = "";
  document.getElementById("pkgAncho").value        = "";
  document.getElementById("pkgAlto").value         = "";
  document.getElementById("pkgEstado").value       = "en_transito";
  document.getElementById("pkgFechaRecepcion").value = "";
  document.getElementById("pkgFechaEntrega").value   = "";

  // Scroll al formulario en movil
  document.getElementById("formNuevoPaquete").scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ==================================================
   Registrar paquete
   ================================================== */
document.getElementById("formNuevoPaquete").addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("mensajeNuevoPaquete").innerHTML = "";

  const idUsuario     = parseInt(document.getElementById("pkgIdUsuario").value);
  const idPrealerta   = parseInt(document.getElementById("pkgIdPrealerta").value);
  const guia          = document.getElementById("pkgGuia").value.trim();
  const descripcion   = document.getElementById("pkgDescripcion").value.trim();
  const peso          = parseFloat(document.getElementById("pkgPeso").value)  || null;
  const largo         = parseFloat(document.getElementById("pkgLargo").value) || null;
  const ancho         = parseFloat(document.getElementById("pkgAncho").value) || null;
  const alto          = parseFloat(document.getElementById("pkgAlto").value)  || null;
  const estado        = document.getElementById("pkgEstado").value;
  const monto         = parseFloat(document.getElementById("pkgMonto").value) || null;
  const fechaRecepcion = document.getElementById("pkgFechaRecepcion").value || null;
  const fechaEntrega   = document.getElementById("pkgFechaEntrega").value   || null;

  if (!guia) {
    document.getElementById("mensajeNuevoPaquete").innerHTML =
      "<div class='alert alert-warning'>La guia del paquete es obligatoria.</div>";
    return;
  }

  const btn = document.getElementById("btnGuardarPaquete");
  btn.disabled    = true;
  btn.textContent = "Registrando...";

  // Insertar paquete
  const { error: errorPaquete } = await supabase
    .from("paquetes")
    .insert([{
      id_usuario:          idUsuario,
      guia_paquete:        guia,
      descripcion_paquete: descripcion || null,
      peso_paquete:        peso,
      largo_paquete:       largo,
      ancho_paquete:       ancho,
      alto_paquete:        alto,
      edo_paquete:         estado,
      monto_cancelado:     monto,
      fecha_recepcion:     fechaRecepcion,
      fecha_prealerta:     new Date().toISOString(),
      fecha_entrega:       fechaEntrega
    }]);

  if (errorPaquete) {
    document.getElementById("mensajeNuevoPaquete").innerHTML =
      "<div class='alert alert-danger'>Error al registrar el paquete: " + errorPaquete.message + "</div>";
    btn.disabled    = false;
    btn.textContent = "Registrar paquete";
    return;
  }

  // Validar la pre-alerta automaticamente
  await supabase
    .from("prealertas")
    .update({ validacion_prealerta: true })
    .eq("id_prealerta", idPrealerta);

  document.getElementById("mensajeNuevoPaquete").innerHTML =
    "<div class='alert alert-success'>Paquete registrado y pre-alerta validada correctamente.</div>";

  btn.disabled    = false;
  btn.textContent = "Registrar paquete";

  // Resetear los tres pasos
  setTimeout(() => {
    document.getElementById("formNuevoPaquete").reset();
    document.getElementById("formNuevoPaquete").style.display       = "none";
    document.getElementById("placeholderFormPaquete").style.display = "block";
    document.getElementById("listaPrelertasUsuario").innerHTML      = "";
    document.getElementById("placeholderPrealertas").style.display  = "block";
    document.getElementById("mensajeNuevoPaquete").innerHTML        = "";
    document.querySelectorAll(".admin-usuario-item").forEach(el => el.classList.remove("seleccionado"));
    cargarUsuariosConPrealertas();
    cargarPaquetes();
  }, 2000);
});

/* ==================================================
   SECCION: Paquetes registrados
   ================================================== */
async function cargarPaquetes() {
  document.getElementById("spinnerPaquetes").style.display = "block";
  document.getElementById("bodyPaquetes").innerHTML = "";

  const { data, error } = await supabase
    .from("paquetes")
    .select("*, usuarios(nombre)")
    .order("id_paquete", { ascending: false });

  document.getElementById("spinnerPaquetes").style.display = "none";

  if (error) {
    document.getElementById("bodyPaquetes").innerHTML =
      `<tr><td colspan="9" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById("bodyPaquetes").innerHTML =
      `<tr><td colspan="9" class="text-center text-muted">Sin paquetes registrados</td></tr>`;
    return;
  }

  document.getElementById("bodyPaquetes").innerHTML = data.map(p => `
    <tr>
      <td>${p.id_paquete}</td>
      <td>${p.usuarios?.nombre || "—"}</td>
      <td><code>${p.guia_paquete}</code></td>
      <td>${p.descripcion_paquete || "—"}</td>
      <td>${p.peso_paquete ? p.peso_paquete + " kg" : "—"}</td>
      <td>${badgeEstado(p.edo_paquete)}</td>
      <td>${formatearFecha(p.fecha_recepcion)}</td>
      <td>${p.monto_cancelado ? "$" + parseFloat(p.monto_cancelado).toFixed(2) : "—"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary fw-bold"
          onclick="abrirActualizarEstado(${p.id_paquete}, '${p.guia_paquete}', '${p.edo_paquete}')">
          Actualizar
        </button>
      </td>
    </tr>
  `).join("");
}

/* ---- Abrir modal actualizar estado ---- */
window.abrirActualizarEstado = function (idPaquete, guia, estadoActual) {
  document.getElementById("mensajeEstadoPaquete").innerHTML = "";
  document.getElementById("estadoPkgId").value             = idPaquete;
  document.getElementById("estadoPkgGuia").value           = guia;
  document.getElementById("estadoPkgEstado").value         = estadoActual;
  document.getElementById("estadoPkgFechaEntrega").value   = "";

  new bootstrap.Modal(document.getElementById("modalEstadoPaquete")).show();
};

/* ---- Guardar nuevo estado ---- */
document.getElementById("formEstadoPaquete").addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("mensajeEstadoPaquete").innerHTML = "";

  const idPaquete    = parseInt(document.getElementById("estadoPkgId").value);
  const nuevoEstado  = document.getElementById("estadoPkgEstado").value;
  const fechaEntrega = document.getElementById("estadoPkgFechaEntrega").value || null;

  const btn = document.getElementById("btnGuardarEstado");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const { error } = await supabase
    .from("paquetes")
    .update({ edo_paquete: nuevoEstado, fecha_entrega: fechaEntrega })
    .eq("id_paquete", idPaquete);

  if (error) {
    document.getElementById("mensajeEstadoPaquete").innerHTML =
      "<div class='alert alert-danger'>Error al actualizar: " + error.message + "</div>";
    btn.disabled    = false;
    btn.textContent = "Guardar estado";
    return;
  }

  document.getElementById("mensajeEstadoPaquete").innerHTML =
    "<div class='alert alert-success'>Estado actualizado correctamente.</div>";

  btn.disabled    = false;
  btn.textContent = "Guardar estado";

  setTimeout(() => {
    bootstrap.Modal.getInstance(document.getElementById("modalEstadoPaquete")).hide();
    document.getElementById("mensajeEstadoPaquete").innerHTML = "";
    cargarPaquetes();
  }, 1500);
});

/* ==================================================
   SECCION: Usuarios registrados
   ================================================== */
async function cargarUsuarios() {
  document.getElementById("spinnerUsuarios").style.display = "block";
  document.getElementById("bodyUsuarios").innerHTML = "";

  const { data, error } = await supabase
    .from("usuarios")
    .select("id_usuario, nombre, correo, telefono, fecha_registro, estado")
    .order("id_usuario", { ascending: true });

  document.getElementById("spinnerUsuarios").style.display = "none";

  if (error) {
    document.getElementById("bodyUsuarios").innerHTML =
      `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById("bodyUsuarios").innerHTML =
      `<tr><td colspan="6" class="text-center text-muted">Sin usuarios registrados</td></tr>`;
    return;
  }

  document.getElementById("bodyUsuarios").innerHTML = data.map(u => `
    <tr>
      <td>CLI-${String(u.id_usuario).padStart(5, "0")}</td>
      <td class="fw-semibold">${u.nombre}</td>
      <td>${u.correo}</td>
      <td>${u.telefono || "—"}</td>
      <td>${formatearFecha(u.fecha_registro)}</td>
      <td>${u.estado
        ? "<span class='badge bg-success'>Activo</span>"
        : "<span class='badge bg-danger'>Inactivo</span>"
      }</td>
    </tr>
  `).join("");
}

/* ---- Iniciar ---- */
cargarUsuariosConPrealertas();
cargarPaquetes();
cargarUsuarios();

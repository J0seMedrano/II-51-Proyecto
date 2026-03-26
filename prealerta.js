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

/* ---- Helper de formato de fecha ---- */
function formatearFecha(timestamp) {
  if (!timestamp) return "—";
  const fecha = new Date(timestamp);
  return fecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ---- Badge de validacion ---- */
function badgeValidacion(validada) {
  return validada
    ? "<span class='badge bg-success px-2 py-1'>Validada</span>"
    : "<span class='badge bg-warning text-dark px-2 py-1'>Pendiente</span>";
}

/* ---- Cargar historial de pre-alertas del usuario ---- */
async function cargarHistorial() {
  const spinner   = document.getElementById("spinnerHistorial");
  const historial = document.getElementById("historialPrealertas");

  spinner.style.display = "block";
  historial.innerHTML   = "";

  const { data, error } = await supabase
    .from("prealertas")
    .select("*")
    .eq("id_usuario", usuario.id_usuario)
    .order("id_prealerta", { ascending: false });

  spinner.style.display = "none";

  if (error) {
    historial.innerHTML = `
      <div class="alert alert-danger">
        Error al cargar el historial: ${error.message}
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    historial.innerHTML = `
      <div class="text-center py-4">
        <p class="fw-bold mt-2 mb-1">Sin pre-alertas registradas</p>
        <p class="text-muted small">Usa el formulario para notificarnos sobre tu proximo paquete.</p>
      </div>
    `;
    return;
  }

  historial.innerHTML = data.map(p => `
    <div class="prealerta-item">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div>
          <p class="fw-bold mb-0" style="color:var(--color-primary-dark)">${p.descripcion_producto}</p>
          <p class="text-muted small mb-0">${p.proveedor_tienda} &middot; Tracking: <code>${p.numero_tracking}</code></p>
        </div>
        <div class="d-flex align-items-center gap-2">
          ${badgeValidacion(p.validacion_prealerta)}
          ${!p.validacion_prealerta
            ? `<button class="btn btn-sm btn-outline-primary px-2 py-1"
                 style="font-size:0.78rem; font-weight:700;"
                 onclick="abrirEditar(${p.id_prealerta})">
                 Editar
               </button>
               <button class="btn btn-sm btn-outline-danger px-2 py-1"
                 style="font-size:0.78rem; font-weight:700;"
                 onclick="eliminarPrealerta(${p.id_prealerta})">
                 Eliminar
               </button>`
            : ""
          }
        </div>
      </div>
      <div class="d-flex gap-4 flex-wrap">
        <div>
          <p class="text-muted small mb-0">Valor declarado</p>
          <p class="fw-semibold mb-0">$${parseFloat(p.valor_declarado).toFixed(2)}</p>
        </div>
        <div>
          <p class="text-muted small mb-0">Fecha de registro</p>
          <p class="fw-semibold mb-0">${formatearFecha(p.fecha_creacion)}</p>
        </div>
      </div>
    </div>
  `).join("");
}

/* ---- Abrir modal de edicion con datos precargados ---- */
window.abrirEditar = async function (idPrealerta) {
  document.getElementById("mensajeEditar").innerHTML = "";

  // Consultar datos actuales de la pre-alerta
  const { data, error } = await supabase
    .from("prealertas")
    .select("*")
    .eq("id_prealerta", idPrealerta)
    .single();

  if (error || !data) {
    alert("No se pudo cargar la pre-alerta.");
    return;
  }

  // Prellenar campos del modal
  document.getElementById("editId").value          = data.id_prealerta;
  document.getElementById("editTracking").value    = data.numero_tracking;
  document.getElementById("editProveedor").value   = data.proveedor_tienda;
  document.getElementById("editDescripcion").value = data.descripcion_producto;
  document.getElementById("editValor").value       = data.valor_declarado;

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
  modal.show();
};

/* ---- Submit del formulario de edicion ---- */
document.getElementById("formEditar").addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("mensajeEditar").innerHTML = "";

  const idPrealerta        = parseInt(document.getElementById("editId").value);
  const numero_tracking    = document.getElementById("editTracking").value.trim();
  const proveedor_tienda   = document.getElementById("editProveedor").value;
  const descripcion        = document.getElementById("editDescripcion").value.trim();
  const valor_declarado    = parseFloat(document.getElementById("editValor").value);

  if (!numero_tracking || !proveedor_tienda || !descripcion || isNaN(valor_declarado)) {
    document.getElementById("mensajeEditar").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos.</div>";
    return;
  }

  const btn = document.getElementById("btnGuardarEdicion");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  // Actualizar en Supabase
  const { error } = await supabase
    .from("prealertas")
    .update({
      numero_tracking:      numero_tracking,
      proveedor_tienda:     proveedor_tienda,
      descripcion_producto: descripcion,
      valor_declarado:      valor_declarado
    })
    .eq("id_prealerta", idPrealerta)
    .eq("id_usuario", usuario.id_usuario);  // seguridad: solo puede editar las suyas

  if (error) {
    document.getElementById("mensajeEditar").innerHTML =
      "<div class='alert alert-danger'>Error al guardar: " + error.message + "</div>";
    btn.disabled    = false;
    btn.textContent = "Guardar cambios";
    return;
  }

  // Cerrar modal y recargar historial
  bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
  btn.disabled    = false;
  btn.textContent = "Guardar cambios";
  cargarHistorial();
});

/* ---- Submit del formulario de nueva pre-alerta ---- */
const form = document.getElementById("formPrealerta");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("mensajePrealerta").innerHTML = "";

  const numero_tracking      = document.getElementById("numero_tracking").value.trim();
  const proveedor_tienda     = document.getElementById("proveedor_tienda").value;
  const descripcion_producto = document.getElementById("descripcion_producto").value.trim();
  const valor_declarado      = parseFloat(document.getElementById("valor_declarado").value);

  if (!numero_tracking || !proveedor_tienda || !descripcion_producto || isNaN(valor_declarado)) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos obligatorios.</div>";
    return;
  }

  const btn = document.getElementById("btnPrealerta");
  btn.disabled    = true;
  btn.textContent = "Enviando...";

  const { error } = await supabase
    .from("prealertas")
    .insert([{
      id_usuario:           usuario.id_usuario,
      numero_tracking:      numero_tracking,
      proveedor_tienda:     proveedor_tienda,
      descripcion_producto: descripcion_producto,
      valor_declarado:      valor_declarado,
      validacion_prealerta: false
    }]);

  if (error) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-danger'>Error al registrar la pre-alerta: " + error.message + "</div>";
    btn.disabled    = false;
    btn.textContent = "Enviar pre-alerta";
    return;
  }

  document.getElementById("mensajePrealerta").innerHTML =
    "<div class='alert alert-success'>Pre-alerta registrada exitosamente. Te notificaremos cuando llegue a tu casillero.</div>";

  form.reset();
  btn.disabled    = false;
  btn.textContent = "Enviar pre-alerta";

  cargarHistorial();
});

/* ---- Necesario para el UPDATE en Supabase ---- */
// Ejecuta este SQL en Supabase si el UPDATE falla:
// CREATE POLICY "actualizar_prealertas" ON prealertas FOR UPDATE USING (true);

/* ---- Eliminar pre-alerta ---- */
window.eliminarPrealerta = async function (idPrealerta) {
  const confirmar = confirm("Seguro que deseas eliminar esta pre-alerta? Esta accion no se puede deshacer.");
  if (!confirmar) return;

  const { error } = await supabase
    .from("prealertas")
    .delete()
    .eq("id_prealerta", idPrealerta)
    .eq("id_usuario", usuario.id_usuario);

  if (error) {
    alert("Error al eliminar la pre-alerta: " + error.message);
    return;
  }

  cargarHistorial();
};

/* ---- Cargar historial al iniciar la pagina ---- */
cargarHistorial();

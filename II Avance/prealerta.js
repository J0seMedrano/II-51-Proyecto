import { supabase } from "./supabase.js";

/* ---- Proteger página: requiere sesión activa ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  window.location.href = "login.html";
}

/* ---- Cerrar sesión ---- */
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

/* ---- Badge de validación ---- */
function badgeValidacion(validada) {
  return validada
    ? "<span class='badge bg-success px-2 py-1'> Validada</span>"
    : "<span class='badge bg-warning text-dark px-2 py-1'> Pendiente</span>";
}

/* ---- Cargar historial de pre-alertas del usuario ---- */
async function cargarHistorial() {
  document.getElementById("spinnerHistorial").style.display = "block";
  document.getElementById("historialPrealertas").innerHTML = "";

  const { data, error } = await supabase
    .from("prealertas")
    .select("*")
    .eq("id_usuario", usuario.id_usuario)
    .order("id_prealerta", { ascending: false });

  document.getElementById("spinnerHistorial").style.display = "none";

  if (error || !data || data.length === 0) {
    document.getElementById("historialPrealertas").innerHTML = `
      <div class="text-center py-4">
        <span style="font-size:2.5rem">📭</span>
        <p class="fw-bold mt-2 mb-1">Sin pre-alertas registradas</p>
        <p class="text-muted small">Usa el formulario para notificarnos sobre tu próximo paquete.</p>
      </div>
    `;
    return;
  }

  const filas = data.map(p => `
    <div class="prealerta-item">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div>
          <p class="fw-bold mb-0" style="color:var(--color-primary-dark)">${p.descripcion_producto}</p>
          <p class="text-muted small mb-0">${p.proveedor_tienda} · Tracking: <code>${p.numero_tracking}</code></p>
        </div>
        ${badgeValidacion(p.validacion_prealerta)}
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

  document.getElementById("historialPrealertas").innerHTML = filas;
}

/* ---- Submit del formulario ---- */
const form = document.getElementById("formPrealerta");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Limpiar mensajes previos
  document.getElementById("mensajePrealerta").innerHTML = "";

  // Obtener valores
  const numero_tracking      = document.getElementById("numero_tracking").value.trim();
  const proveedor_tienda     = document.getElementById("proveedor_tienda").value;
  const descripcion_producto = document.getElementById("descripcion_producto").value.trim();
  const valor_declarado      = parseFloat(document.getElementById("valor_declarado").value);

  // Validación básica
  if (!numero_tracking || !proveedor_tienda || !descripcion_producto || isNaN(valor_declarado)) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos obligatorios.</div>";
    return;
  }

  // Deshabilitar botón mientras se procesa
  const btn = document.getElementById("btnPrealerta");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  // Insertar en Supabase — vinculado al usuario en sesión
  const { error } = await supabase
    .from("prealertas")
    .insert([{
      id_usuario:           usuario.id_usuario,
      numero_tracking:      numero_tracking,
      proveedor_tienda:     proveedor_tienda,
      descripcion_producto: descripcion_producto,
      valor_declarado:      valor_declarado,
      validacion_prealerta: false   // por defecto pendiente hasta que el admin valide
    }]);

  if (error) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-danger'>Error al registrar la pre-alerta: " + error.message + "</div>";
    btn.disabled = false;
    btn.textContent = "Enviar pre-alerta";
    return;
  }

  // Éxito — limpiar formulario y recargar historial
  document.getElementById("mensajePrealerta").innerHTML =
    "<div class='alert alert-success'>✅ Pre-alerta registrada exitosamente. Te notificaremos cuando llegu e a tu casillero.</div>";

  form.reset();
  btn.disabled = false;
  btn.textContent = "Enviar pre-alerta";

  // Recargar historial para mostrar la nueva entrada
  cargarHistorial();
});

/* ---- Cargar historial al iniciar la página ---- */
cargarHistorial();

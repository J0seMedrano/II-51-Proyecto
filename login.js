import { supabase } from "./supabase.js";

/* ---- Credencial de administrador ---- */
const ADMIN_CORREO   = "root@admin.com";
const ADMIN_PASSWORD = "r00T@!";

/* ---- Mostrar / ocultar contrasena ---- */
document.querySelectorAll(".btn-toggle-password").forEach(btn => {
  btn.addEventListener("click", function () {
    const targetId = this.getAttribute("data-target");
    const input    = document.getElementById(targetId);
    input.type     = input.type === "password" ? "text" : "password";
    this.textContent = input.type === "password" ? "👁" : "🙈";
  });
});

/* ---- Submit del formulario ---- */
const form = document.getElementById("formLogin");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("errorPassword").textContent = "";
  document.getElementById("mensajeLogin").innerHTML    = "";

  const correo   = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value;

  if (!correo || !password) {
    document.getElementById("mensajeLogin").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos.</div>";
    return;
  }

  const btn = document.getElementById("btnLogin");
  btn.disabled    = true;
  btn.textContent = "Verificando...";

  // Verificar usuario en Supabase
  const { data, error } = await supabase
    .from("usuarios")
    .select("id_usuario, nombre, correo, telefono, direccion, estado")
    .eq("correo", correo)
    .eq("password", password)
    .single();

  if (error) {
    document.getElementById("mensajeLogin").innerHTML =
      "<div class='alert alert-danger'>Correo o contrasena incorrectos.</div>";
    btn.disabled    = false;
    btn.textContent = "Ingresar";
    return;
  }

  if (!data.estado) {
    document.getElementById("mensajeLogin").innerHTML =
      "<div class='alert alert-warning'>Tu cuenta esta desactivada. Contacta a soporte.</div>";
    btn.disabled    = false;
    btn.textContent = "Ingresar";
    return;
  }

  // Guardar sesion en localStorage
  localStorage.setItem("usuario", JSON.stringify(data));

  // Detectar si es administrador y redirigir segun rol
  if (correo === ADMIN_CORREO && password === ADMIN_PASSWORD) {
    localStorage.setItem("rol", "admin");
    document.getElementById("mensajeLogin").innerHTML =
      "<div class='alert alert-success'>Bienvenido, Administrador. Redirigiendo...</div>";
    setTimeout(() => {
      window.location.href = "dashboard_admin.html";
    }, 1500);
  } else {
    localStorage.setItem("rol", "cliente");
    document.getElementById("mensajeLogin").innerHTML =
      "<div class='alert alert-success'>Bienvenido, " + data.nombre + ". Redirigiendo...</div>";
    setTimeout(() => {
      window.location.href = "dashboard_cliente.html";
    }, 1500);
  }

});

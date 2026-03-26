/* ---- Navbar dinamico segun sesion ---- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
const navAcciones = document.getElementById("navAcciones");

if (usuario) {
  navAcciones.innerHTML = `
    <li class="nav-item">
      <a class="btn btn-outline-primary btn-sm px-3" href="dashboard_cliente.html">Mi dashboard</a>
    </li>
  `;
} else {
  navAcciones.innerHTML = `
    <li class="nav-item">
      <a class="btn btn-outline-primary btn-sm px-3" href="login.html">Iniciar sesion</a>
    </li>
    <li class="nav-item">
      <a class="btn btn-primary btn-sm px-3 text-white" href="registro.html">Registrarse</a>
    </li>
  `;
}

/* ---- Formulario de contacto ---- */
const formContacto = document.getElementById("formContacto");

formContacto.addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre  = document.getElementById("contactoNombre").value.trim();
  const correo  = document.getElementById("contactoCorreo").value.trim();
  const mensaje = document.getElementById("contactoMensaje").value.trim();

  if (!nombre || !correo || !mensaje) {
    document.getElementById("mensajeContacto").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos.</div>";
    return;
  }

  const btn = document.getElementById("btnContacto");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  // Simulacion de envio — aqui se puede integrar un servicio de correo
  setTimeout(() => {
    document.getElementById("mensajeContacto").innerHTML =
      "<div class='alert alert-success'>Mensaje enviado correctamente. Te contactaremos pronto.</div>";
    formContacto.reset();
    btn.disabled = false;
    btn.textContent = "Enviar mensaje";
  }, 1000);

});

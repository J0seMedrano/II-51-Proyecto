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

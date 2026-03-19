//funcion estimar costo envio
document.addEventListener("DOMContentLoaded", function () {

  const form = document.querySelector(".form-estimator");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // datos
    let peso = parseFloat(document.getElementById("peso").value);
    let valor = parseFloat(document.getElementById("valor").value);
    let largo = parseFloat(document.getElementById("largo").value);
    let ancho = parseFloat(document.getElementById("ancho").value);
    let alto = parseFloat(document.getElementById("alto").value);

    // si no hay dimensiones
    if (isNaN(largo)) largo = 0;
    if (isNaN(ancho)) ancho = 0;
    if (isNaN(alto)) alto = 0;

    // peso volumetrico
    let volumetrico = (largo * ancho * alto) / 5000;

    // peso a cobrar
    let pesoCobrar;

    if (peso > volumetrico) {
      pesoCobrar = peso;
    } else {
      pesoCobrar = volumetrico;
    }

    // costo envio
    let costo = pesoCobrar * 8.5;

    // minimo
    if (costo < 12) {
      costo = 12;
    }

    // seguro
    let seguro = 0;
    if (valor >= 100) {
      seguro = valor * 0.02;
    }

    // total
    let total = costo + seguro;

    // mostrar
    document.getElementById("estimador-resultado").innerHTML =
      "<strong>Total: $" + total.toFixed(2) + "</strong>";
  });

});

import { aplicarFiltrosGenerico } from "./filtros.js";

const API = "http://localhost:3000/medicamentos";
const API_VENTAS = "http://localhost:3000/venta";
const API_EMPLEADOS = "http://localhost:3000/empleados";

let datosGlobal = [];



/* =========================
   UTILIDADES
========================= */

const getValue = (id) => document.getElementById(id).value;

const limpiarInputs = (ids) => {
    ids.forEach(id => document.getElementById(id).value = "");
};

const resetSelect = (id) => {
    document.getElementById(id).selectedIndex = 0;
};

/* =========================
   API
========================= */

async function fetchData() {
    const res = await fetch(API);
    return await res.json();
}

async function crearProducto(data) {
    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

async function eliminarProducto(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
}

async function actualizarProducto(id, data) {
    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

//API EMPLEADOS
async function fetchEmpleados() {
    const res = await fetch(API_EMPLEADOS);
    return await res.json();
}

async function crearEmpleado(data) {
    await fetch(API_EMPLEADOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

async function eliminarEmpleado(id) {
    await fetch(`${API_EMPLEADOS}/${id}`, { method: "DELETE" });
}

async function actualizarEmpleado(id, data) {
    await fetch(`${API_EMPLEADOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

/* =========================
   RENDER
========================= */

function renderTablaConsulta(data) {
    const tabla = document.getElementById("tablaConsulta");
    tabla.innerHTML = "";

    data.forEach(({ id, nombre, precio, stock }) => {
        tabla.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${precio}</td>
                <td>${stock}</td>
            </tr>
        `;
    });
}

function renderTablaInventario(data) {
    const tabla = document.getElementById("tablaBody");
    tabla.innerHTML = "";

    data.forEach(({ id, nombre, precio, stock }) => {
        tabla.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${precio}</td>
                <td>${stock}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminar(${id})">Eliminar</button>
                    <button class="btn btn-warning btn-sm" onclick="editarFila(this, ${id})">Editar</button>
                </td>
            </tr>
        `;
    });
}

//TABLA EMPLEADOS
function renderTablaEmpleados(data) {
    const tabla = document.getElementById("tablaEmpleados");
    tabla.innerHTML = "";

    data.forEach(({ id, nombre, apellidos, turno, rfc, telefono, puesto }) => {
        tabla.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${apellidos}</td>
                <td>${turno}</td>
                <td>${rfc}</td>
                <td>${telefono}</td>
                <td>${puesto}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarEmpleadoUI(${id})">Eliminar</button>
                    <button class="btn btn-warning btn-sm" onclick="editarEmpleado(this, ${id})">Editar</button>
                </td>
            </tr>
        `;
    });
}

/* =========================
   CARGA DE DATOS
========================= */

async function cargarDatos() {
    const data = await fetchData();
    renderTablaInventario(data);
}

async function cargarConsulta() {
    datosGlobal = await fetchData();
    aplicarFiltros();
}

async function cargarEmpleados() {
    const data = await fetchEmpleados();
    renderTablaEmpleados(data);
}
/* =========================
   CRUD UI
========================= */

//Inventario
document.getElementById("formProducto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevoProducto = {
        nombre: getValue("nombre"),
        precio: getValue("precio"),
        stock: getValue("stock")
    };

    await crearProducto(nuevoProducto);

    e.target.reset();
    cargarProductosVenta()
    cargarDatos();
    cargarConsulta();
});

async function eliminar(id) {
    await eliminarProducto(id);
    cargarProductosVenta()
    cargarDatos();
    cargarConsulta();
}

function editarFila(boton, id) {
    const fila = boton.closest("tr");
    const celdas = fila.children;

    const [ , nombre, precio, stock ] = [...celdas].map(td => td.innerText);

    celdas[1].innerHTML = `<input class="form-control" value="${nombre}">`;
    celdas[2].innerHTML = `<input class="form-control" type="number" step="0.01" value="${precio}">`;
    celdas[3].innerHTML = `<input class="form-control" type="number" min="0" value="${stock}">`;

    celdas[4].innerHTML = `
        <button class="btn btn-success btn-sm" onclick="guardar(${id}, this)">Guardar</button>
        <button class="btn btn-secondary btn-sm" onclick="cargarDatos()">Cancelar</button>
    `;
}

async function guardar(id, boton) {
    const fila = boton.closest("tr");
    const inputs = fila.querySelectorAll("input");

    const data = {
        nombre: inputs[0].value,
        precio: inputs[1].value,
        stock: inputs[2].value
    };

    await actualizarProducto(id, data);

    cargarDatos();
    cargarConsulta();
    cargarProductosVenta()
}

function obtenerConfig(ids) {
    return {
        texto: getValue(ids.buscador).toLowerCase(),
        precioMin: getValue(ids.precioMin),
        precioMax: getValue(ids.precioMax),
        stockFiltro: getValue(ids.stockFiltro),
        ordenar: getValue(ids.ordenar)
    };
}

function aplicarFiltros() {
    const config = obtenerConfig({
        buscador: "buscador",
        precioMin: "precioMin",
        precioMax: "precioMax",
        stockFiltro: "stockFiltro",
        ordenar: "ordenar"
    });

    const resultado = aplicarFiltrosGenerico(datosGlobal, config);
    renderTablaConsulta(resultado);
}

function aplicarFiltrosTabla2() {
    const config = obtenerConfig({
        buscador: "buscador2",
        precioMin: "precioMin2",
        precioMax: "precioMax2",
        stockFiltro: "stockFiltro2",
        ordenar: "ordenar2"
    });

    const resultado = aplicarFiltrosGenerico(datosGlobal, config);
    renderTablaInventario(resultado);
}

//EMPLEADOS
document.getElementById("formEmpleado").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevoEmpleado = {
        nombre: getValue("nombreEmpleado"),
        apellidos: getValue("apellidosEmpleado"),
        turno: getValue("turnoEmpleado"),
        rfc: getValue("rfcEmpleado"),
        telefono: getValue("telefonoEmpleado"),
        puesto: getValue("puestoEmpleado")
    };

    await crearEmpleado(nuevoEmpleado);

    e.target.reset();
    cargarEmpleados();
});

async function eliminarEmpleadoUI(id) {
    await eliminarEmpleado(id);
    cargarEmpleados();
}

function editarEmpleado(boton, id) {
    const fila = boton.closest("tr");
    const celdas2 = fila.children;

    const nombre    = celdas2[1].innerText;
    const apellidos = celdas2[2].innerText;
    const turno     = celdas2[3].innerText;
    const rfc       = celdas2[4].innerText;
    const telefono  = celdas2[5].innerText;
    const puesto    = celdas2[6].innerText;

    celdas2[1].innerHTML = `<input class="form-control" value="${nombre}">`;
    celdas2[2].innerHTML = `<input class="form-control" value="${apellidos}">`;
    celdas2[3].innerHTML = `<input class="form-control" value="${turno}">`;
    celdas2[4].innerHTML = `<input class="form-control" value="${rfc}">`;
    celdas2[5].innerHTML = `<input class="form-control" value="${telefono}">`;
    celdas2[6].innerHTML = `<input class="form-control" value="${puesto}">`;

    celdas2[7].innerHTML = `
        <button class="btn btn-success btn-sm" onclick="guardarEmpleado(${id}, this)">Guardar</button>
        <button class="btn btn-secondary btn-sm" onclick="cargarEmpleados()">Cancelar</button>
    `;
}


async function guardarEmpleado(id, boton) {
    const fila = boton.closest("tr");
    const input = fila.querySelector("input");

    const data = {
        nombre: input.value,
        apellidos: input.value,
        turno: input.value,
        rfc: input.value,
        telefono: input.value,
        puesto: input.value
    };

    await actualizarEmpleado(id, data);
    cargarEmpleados();
}

/* =========================
   EVENTOS
========================= */

function asignarEventos() {
    // Filtros consulta
    ["buscador", "precioMin", "precioMax"].forEach(id =>
        document.getElementById(id).addEventListener("input", aplicarFiltros)
    );

    ["stockFiltro", "ordenar"].forEach(id =>
        document.getElementById(id).addEventListener("change", aplicarFiltros)
    );

    // Filtros inventario
    ["buscador2", "precioMin2", "precioMax2"].forEach(id =>
        document.getElementById(id).addEventListener("input", aplicarFiltrosTabla2)
    );

    ["stockFiltro2", "ordenar2"].forEach(id =>
        document.getElementById(id).addEventListener("change", aplicarFiltrosTabla2)
    );

    // Reset filtros
    document.getElementById("resetFiltros").addEventListener("click", () => {
        limpiarInputs(["buscador", "precioMin", "precioMax", "stockFiltro"]);
        resetSelect("ordenar");
        cargarConsulta();
    });

    document.getElementById("resetFiltros2").addEventListener("click", () => {
        limpiarInputs(["buscador2", "precioMin2", "precioMax2", "stockFiltro2"]);
        resetSelect("ordenar2");
        cargarDatos();
    });
}

/* =========================
   Ventas
========================= */
async function cargarVentas() {
        const res = await fetch(API_VENTAS);
        const ventas = await res.json();

        const tabla = document.getElementById("tablaVentas");
        tabla.innerHTML = "";

        ventas.forEach(v => {
            tabla.innerHTML += `
                <tr data-id="${v.id}" style="cursor:pointer;">
                    <td>${v.id}</td>
                    <td>${v.fecha}</td>
                    <td>$${v.total}</td>
                </tr>
            `;
        });

}


function activarEventosVentas() {
    const tabla = document.getElementById("tablaVentas");

    tabla.addEventListener("click", (e) => {
        const fila = e.target.closest("tr");
        if (!fila) return;

        const id = fila.dataset.id;
        verDetalleVenta(id);
    });
}

/* =========================
   Detalles venta
========================= */
async function verDetalleVenta(id) {
    try {
        const res = await fetch(`${API_VENTAS}/${id}`);

        // Validar respuesta HTTP
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error del servidor:", errorText);
            return;
        }

        const venta = await res.json();

        // Validar estructura básica
        if (!venta || typeof venta !== "object") {
            console.error("Respuesta inválida:", venta);
            return;
        }

        // =========================
        // INFO GENERAL
        // =========================
        document.getElementById("detalleVentaInfo").innerHTML = `
            <p><strong>ID:</strong> ${venta.id ?? "-"}</p>
            <p><strong>Fecha:</strong> ${venta.fecha ?? "-"}</p>
            <p><strong>Empleado:</strong> ${venta.empleado ?? "Sin empleado"}</p>
            <p><strong>ID Empleado:</strong> ${venta.empleado_id ?? "-"}</p>
        `;

        // =========================
        // PRODUCTOS
        // =========================
        const tabla = document.getElementById("tablaDetalleVenta");
        tabla.innerHTML = "";

        if (!Array.isArray(venta.productos) || venta.productos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        Sin productos
                    </td>
                </tr>
            `;
        } else {
            venta.productos.forEach(p => {
                tabla.innerHTML += `
                    <tr>
                        <td>${p.nombre ?? "Sin nombre"}</td>
                        <td>${(p.cantidad ?? 0)}</td>
                        <td>$${(p.precio ?? 0).toFixed(2)}</td>
                        <td>$${(p.subtotal ?? 0).toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        // =========================
        // TOTAL
        // =========================
        document.getElementById("totalVenta").innerText =
            `$${(venta.total ?? 0).toFixed(2)}`;

    } catch (error) {
        console.error("Error cargando detalle:", error);

        // Feedback visual mínimo
        document.getElementById("detalleVentaInfo").innerHTML = `
            <p class="text-danger">Error al cargar la venta</p>
        `;
    }
}

/* =========================
   REALIZAR VENTA (FRONTEND)
========================= */

let carrito = [];


// Cargar productos en tabla de venta
async function cargarProductosVenta() {
    const productos = await fetchData();
    const tabla = document.getElementById("tablaProductosVenta");
    tabla.innerHTML = "";

    productos.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>$${p.precio}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn btn-sm ${p.stock > 0 ? 'btn-primary' : 'btn-secondary'}"
                    ${p.stock > 0 
                        ? `onclick='agregarAlCarrito(${JSON.stringify(p)})'` 
                        : 'disabled'}>
                    ${p.stock > 0 ? 'Agregar' : 'Sin stock'}
                    </button>
                </td>
            </tr>
        `;
    });
}

// Cargar empleados en select
async function cargarEmpleadosVenta() {
    const empleados = await fetchEmpleados();
    const select = document.getElementById("empleadoVenta");
    select.innerHTML = `<option value="">Seleccionar...</option>`;

    empleados.forEach(e => {
        select.innerHTML += `
            <option value="${e.id}">${e.nombre} ${e.apellidos}</option>
        `;
    });
}

// Agregar producto al carrito
window.agregarAlCarrito = function(producto) {

    if (producto.stock <= 0) {
        alert("Sin stock disponible");
        return;
    }

    const existente = carrito.find(p => p.id === producto.id);

    if (existente) {

        if (existente.cantidad >= producto.stock) {
            alert("No hay suficiente stock");
            return;
        }

        existente.cantidad++;
        existente.subtotal = existente.cantidad * existente.precio;

    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            subtotal: producto.precio
        });
    }

    renderCarrito();
};

// Render carrito
function renderCarrito() {
    const tabla = document.getElementById("tablaCarrito");
    tabla.innerHTML = "";

    let total = 0;

    carrito.forEach((p, index) => {
        total += p.subtotal;

        tabla.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
                <td>$${p.precio}</td>
                <td>$${p.subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm"
                        onclick="eliminarDelCarrito(${index})">
                        X
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalVentaActual").innerText = `$${total.toFixed(2)}`;
}

// Eliminar producto del carrito
window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    renderCarrito();
};

// Finalizar venta
document.getElementById("btnFinalizarVenta").addEventListener("click", async () => {

    if (carrito.length === 0) {
        alert("Agrega productos");
        return;
    }

    const empleado_id = document.getElementById("empleadoVenta").value;

    if (!empleado_id) {
        alert("Selecciona un empleado");
        return;
    }

    const total = carrito.reduce((acc, p) => acc + p.subtotal, 0);

    const venta = {
        fecha: new Date().toISOString(),
        total,
        empleado: empleado_id,
        productos: carrito
    };

    await fetch(API_VENTAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venta)
    });

    // Reset
    carrito = [];
    renderCarrito();
    cargarProductosVenta();
    cargarDatos();
    cargarConsulta();
    cargarVentas();
    renderCarrito();

    alert("Venta realizada correctamente");
});

// Cancelar venta
document.getElementById("btnCancelarVenta").addEventListener("click", () => {
    carrito = [];
    renderCarrito();
});

// =========================
// LOGIN SIMPLE (FRONTEND)
// =========================

    const loginScreen = document.getElementById("loginScreen");
    const appContent = document.getElementById("appContent");
    const appHeader = document.getElementById("appHeader");

function bloquearApp() {
    const login = document.getElementById("loginScreen");

    login.classList.remove("d-none");
    login.classList.add("d-flex"); 

    document.getElementById("appContent").style.display = "none";
    document.getElementById("appHeader").style.display = "none";
}

function desbloquearApp() {
    const login = document.getElementById("loginScreen");
    login.classList.remove("d-flex"); 
    login.classList.add("d-none");   

    document.getElementById("appContent").style.display = "block";
    document.getElementById("appHeader").style.display = "block";
}

// Simulación de login
document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const user = document.getElementById("usuario").value;
    const pass = document.getElementById("password").value;

    //LOGIN TEMPORAL (hardcodeado)
    if (user === "admin" && pass === "1234") {
        document.getElementById("loginError").classList.add("d-none");

        localStorage.setItem("logueado", "true");
        desbloquearApp();
        iniciarApp();
    } else {
            document.getElementById("loginError").classList.remove("d-none");
    }
    
});

// Mantener sesión
function verificarSesion() {
    const logueado = localStorage.getItem("logueado");

    if (logueado === "true") {
        desbloquearApp();
    } else {
        bloquearApp();
    }
}

//CERRAR SESION
window.logout = function () {
    localStorage.removeItem("logueado");
    location.reload(); 
    bloquearApp();
};

/* =========================
   INIT
========================= */

window.eliminar = eliminar;
window.editarFila = editarFila;
window.guardar = guardar;
window.cargarDatos = cargarDatos;

window.eliminarEmpleadoUI = eliminarEmpleadoUI;
window.editarEmpleado = editarEmpleado;
window.guardarEmpleado = guardarEmpleado;
window.cargarEmpleados = cargarEmpleados;

function iniciarApp() {
    cargarVentas();
    activarEventosVentas();
    asignarEventos();
    cargarDatos();
    cargarConsulta();
    cargarEmpleados();
    cargarProductosVenta();
    cargarEmpleadosVenta();
}

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();

    if (localStorage.getItem("logueado") === "true") {
        iniciarApp();
    }
});

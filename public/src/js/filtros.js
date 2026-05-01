export function aplicarFiltrosGenerico(data, config) {
    let resultado = [...data];

    const {
        texto,
        precioMin,
        precioMax,
        stockFiltro,
        ordenar
    } = config;

    // Buscador
    if (texto) {
        resultado = resultado.filter(item =>
            item.nombre.toLowerCase().includes(texto)
        );
    }

    // Precio
    if (precioMin) {
        resultado = resultado.filter(item => item.precio >= precioMin);
    }

    if (precioMax) {
        resultado = resultado.filter(item => item.precio <= precioMax);
    }

    // Stock
    if (stockFiltro === "disponible") {
        resultado = resultado.filter(item => item.stock > 0);
    }

    if (stockFiltro === "agotado") {
        resultado = resultado.filter(item => item.stock == 0);
    }

    // Orden
    if (ordenar === "nombreAz") {
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    if (ordenar === "nombreZa") {
        resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
    }

    if (ordenar === "id") {
        resultado.sort((a, b) => a.id - b.id);
    }

    if (ordenar === "precioAsc") {
        resultado.sort((a, b) => a.precio - b.precio);
    }

    if (ordenar === "precioDesc") {
        resultado.sort((a, b) => b.precio - a.precio);
    }

    return resultado;
}
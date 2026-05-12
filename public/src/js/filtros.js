export function aplicarFiltrosGenerico(data, config) {

    let resultado = [...data];

    const {
        texto,
        precioMin,
        precioMax,
        stockFiltro,
        tipoFiltro,
        ordenar
    } = config;

    // =========================
    // BUSCADOR
    // =========================
    if (texto) {
        resultado = resultado.filter(item =>
            item.nombre.toLowerCase().includes(texto.toLowerCase())
        );
    }

    // =========================
    // PRECIO
    // =========================
    if (precioMin) {
        resultado = resultado.filter(item =>
            Number(item.precio) >= Number(precioMin)
        );
    }

    if (precioMax) {
        resultado = resultado.filter(item =>
            Number(item.precio) <= Number(precioMax)
        );
    }

    // =========================
    // STOCK
    // =========================
    if (stockFiltro === "disponible") {
        resultado = resultado.filter(item =>
            Number(item.stock) > 0
        );
    }

    if (stockFiltro === "agotado") {
        resultado = resultado.filter(item =>
            Number(item.stock) === 0
        );
    }

    // =========================
    // TIPO
    // =========================
    if (tipoFiltro) {

        resultado = resultado.filter(item => {

            const tipoItem = String(item.tipo || "")
                .toLowerCase()
                .trim();

            return tipoItem === tipoFiltro.toLowerCase();
        });
    }

    // =========================
    // ORDENAMIENTO
    // =========================
    if (ordenar === "nombreAz") {
        resultado.sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
        );
    }

    if (ordenar === "nombreZa") {
        resultado.sort((a, b) =>
            b.nombre.localeCompare(a.nombre)
        );
    }

    if (ordenar === "id") {
        resultado.sort((a, b) =>
            a.id - b.id
        );
    }

    if (ordenar === "precioAsc") {
        resultado.sort((a, b) =>
            a.precio - b.precio
        );
    }

    if (ordenar === "precioDesc") {
        resultado.sort((a, b) =>
            b.precio - a.precio
        );
    }

    return resultado;
}
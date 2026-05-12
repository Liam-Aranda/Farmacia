import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Usa variables de entorno en producción
const supabaseUrl = process.env.SUPABASE_URL || 'https://tskwqtxvqaarzsgbjrxr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_5EO7db5F8x4F8tV7lbXdEw_N7JQZm6Q';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLA_MEDICAMENTOS = 'medicamentos';
const TABLA_PRODUCTOS = 'productos';
const TABLA_VENTA = 'venta';
const TABLA_DETALLE_MEDICAMENTOS = 'medicamentos_venta';
const TABLA_DETALLE_PRODUCTOS = 'productos_venta';

function normalizarTipo(tipo) {
  const t = String(tipo || '').toLowerCase().trim();
  if (t === 'medicamento' || t === 'medicamentos') return 'medicamento';
  if (t === 'producto' || t === 'productos') return 'producto';
  return null;
}

function obtenerConfigDetalle(tipo) {
  const t = normalizarTipo(tipo);

  if (t === 'producto') {
    return {
      tablaInventario: TABLA_PRODUCTOS,
      tablaDetalle: TABLA_DETALLE_PRODUCTOS,
      campoFk: 'producto_id',
      tipoLabel: 'Producto'
    };
  }

  return {
    tablaInventario: TABLA_MEDICAMENTOS,
    tablaDetalle: TABLA_DETALLE_MEDICAMENTOS,
    campoFk: 'medicamento_id',
    tipoLabel: 'Medicamento'
  };
}

/* =========================
   VENTAS
========================= */

// Obtener ventas
app.get('/venta', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLA_VENTA)
    .select('id, fecha, total, empleado')
    .order('id', { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Obtener detalle de una venta
app.get('/venta/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener venta principal
    const { data: venta, error: errorVenta } = await supabase
      .from(TABLA_VENTA)
      .select('id, fecha, total, empleado')
      .eq('id', id)
      .single();

    if (errorVenta) return res.status(500).json(errorVenta);

    // Obtener empleado
    const { data: empleadoData, error: errorEmpleado } = await supabase
      .from('empleados')
      .select('nombre')
      .eq('id', venta.empleado)
      .single();

    if (errorEmpleado && errorEmpleado.code !== 'PGRST116') {
      return res.status(500).json(errorEmpleado);
    }

    // Obtener detalles de medicamentos
    const { data: medsVenta, error: errorMeds } = await supabase
      .from(TABLA_DETALLE_MEDICAMENTOS)
      .select(`
        medicamento_id,
        cantidad,
        subtotal,
        medicamentos (
          nombre,
          precio
        )
      `)
      .eq('venta_id', id);

    if (errorMeds) return res.status(500).json(errorMeds);

    // Obtener detalles de productos
    const { data: productosVenta, error: errorProductos } = await supabase
      .from(TABLA_DETALLE_PRODUCTOS)
      .select(`
        producto_id,
        cantidad,
        subtotal,
        productos (
          nombre,
          precio
        )
      `)
      .eq('venta_id', id);

    if (errorProductos) return res.status(500).json(errorProductos);

    const medicamentos = (medsVenta || []).map(m => ({
      id: m.medicamento_id,
      tipo: 'Medicamento',
      cantidad: m.cantidad,
      subtotal: m.subtotal,
      nombre: m.medicamentos?.nombre || 'Sin nombre',
      precio: m.medicamentos?.precio || 0
    }));

    const productos = (productosVenta || []).map(p => ({
      id: p.producto_id,
      tipo: 'Producto',
      cantidad: p.cantidad,
      subtotal: p.subtotal,
      nombre: p.productos?.nombre || 'Sin nombre',
      precio: p.productos?.precio || 0
    }));

    res.json({
      id: venta.id,
      fecha: venta.fecha,
      total: venta.total,
      empleado_id: venta.empleado,
      empleado: empleadoData?.nombre || 'Sin empleado',
      productos: [...medicamentos, ...productos]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Realizar venta
app.post('/venta', async (req, res) => {
  const { fecha, total, empleado, productos: itemsVenta } = req.body;

  if (!Array.isArray(itemsVenta) || itemsVenta.length === 0) {
    return res.status(400).json({ error: 'La venta debe incluir productos.' });
  }

  let ventaCreada = null;
  const stocksRestaurar = [];

  try {
    // Crear venta
    const { data: venta, error: errorVenta } = await supabase
      .from(TABLA_VENTA)
      .insert([{ fecha, total, empleado }])
      .select()
      .single();

    if (errorVenta) throw errorVenta;
    ventaCreada = venta;

    // Procesar cada item
    for (const p of itemsVenta) {
      const tipoNormalizado = normalizarTipo(p.tipo);

      if (!tipoNormalizado) {
        throw new Error(`Tipo inválido para el producto con id ${p.id}`);
      }

      const { tablaInventario, tablaDetalle, campoFk } = obtenerConfigDetalle(tipoNormalizado);

      const cantidad = Number(p.cantidad || 0);
      const subtotal = Number(p.subtotal || 0);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad inválida para el producto con id ${p.id}`);
      }

      // Obtener stock actual
      const { data: itemActual, error: errorItem } = await supabase
        .from(tablaInventario)
        .select('id, stock')
        .eq('id', p.id)
        .single();

      if (errorItem) throw errorItem;

      const stockActual = Number(itemActual.stock || 0);

      if (stockActual < cantidad) {
        throw new Error(`Stock insuficiente para el item ${p.id}`);
      }

      const nuevoStock = stockActual - cantidad;

      // Guardar stock previo para rollback
      stocksRestaurar.push({
        tabla: tablaInventario,
        id: p.id,
        stockAnterior: stockActual
      });

      // Descontar stock
      const { error: errorStock } = await supabase
        .from(tablaInventario)
        .update({ stock: nuevoStock })
        .eq('id', p.id);

      if (errorStock) throw errorStock;

      // Insertar detalle en su tabla correspondiente
      const { error: errorDetalle } = await supabase
        .from(tablaDetalle)
        .insert([{
          venta_id: venta.id,
          [campoFk]: p.id,
          cantidad,
          subtotal
        }]);

      if (errorDetalle) throw errorDetalle;
    }

    res.json({ ok: true, venta });

  } catch (error) {
    console.error(error);

    // Rollback de stock
    for (const item of stocksRestaurar.reverse()) {
      await supabase
        .from(item.tabla)
        .update({ stock: item.stockAnterior })
        .eq('id', item.id);
    }

    // Borrar detalles y venta si ya se había creado
    if (ventaCreada?.id) {
      await supabase
        .from(TABLA_DETALLE_MEDICAMENTOS)
        .delete()
        .eq('venta_id', ventaCreada.id);

      await supabase
        .from(TABLA_DETALLE_PRODUCTOS)
        .delete()
        .eq('venta_id', ventaCreada.id);

      await supabase
        .from(TABLA_VENTA)
        .delete()
        .eq('id', ventaCreada.id);
    }

    res.status(500).json({ error: error.message });
  }
});

/* =========================
   MEDICAMENTOS
========================= */

// Obtener medicamentos
app.get('/medicamentos', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLA_MEDICAMENTOS)
    .select('*');

  if (error) return res.status(500).json(error);

  res.json((data || []).map(item => ({
    ...item,
    tipo: 'medicamento',
    endpoint: '/medicamentos'
  })));
});

// Agregar medicamento
app.post('/medicamentos', async (req, res) => {
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from(TABLA_MEDICAMENTOS)
    .insert([{ nombre, precio, stock }])
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Actualizar medicamento
app.put('/medicamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from(TABLA_MEDICAMENTOS)
    .update({ nombre, precio, stock })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Eliminar medicamento
app.delete('/medicamentos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from(TABLA_MEDICAMENTOS)
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ mensaje: 'Eliminado' });
});

/* =========================
   PRODUCTOS
========================= */

// Obtener productos
app.get('/productos', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLA_PRODUCTOS)
    .select('*');

  if (error) return res.status(500).json(error);

  res.json((data || []).map(item => ({
    ...item,
    tipo: 'producto',
    endpoint: '/productos'
  })));
});

// Agregar producto
app.post('/productos', async (req, res) => {
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from(TABLA_PRODUCTOS)
    .insert([{ nombre, precio, stock }])
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Actualizar producto
app.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from(TABLA_PRODUCTOS)
    .update({ nombre, precio, stock })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Eliminar producto
app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from(TABLA_PRODUCTOS)
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ mensaje: 'Eliminado' });
});

/* =========================
   EMPLEADOS
========================= */

// Obtener empleados
app.get('/empleados', async (req, res) => {
  const { data, error } = await supabase
    .from('empleados')
    .select('*');

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Agregar empleados
app.post('/empleados', async (req, res) => {
  const { nombre, apellidos, turno, rfc, telefono, puesto } = req.body;

  const { data, error } = await supabase
    .from('empleados')
    .insert([{ nombre, apellidos, turno, rfc, telefono, puesto }])
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Actualizar empleados
app.put('/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, turno, rfc, telefono, puesto } = req.body;

  const { data, error } = await supabase
    .from('empleados')
    .update({ nombre, apellidos, turno, rfc, telefono, puesto })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Eliminar empleados
app.delete('/empleados/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('empleados')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ mensaje: 'Eliminado' });
});

app.use(express.static('public'));

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
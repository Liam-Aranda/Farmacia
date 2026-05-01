import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = 'https://tskwqtxvqaarzsgbjrxr.supabase.co';
const supabaseKey = 'sb_publishable_5EO7db5F8x4F8tV7lbXdEw_N7JQZm6Q';

const supabase = createClient(supabaseUrl, supabaseKey);



// Obtener ventas
app.get('/venta', async (req, res) => {
  const { data, error } = await supabase
    .from('venta')
    .select('id, fecha, total, empleado')
    .order('id', { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Obtener detalle de una venta
app.get('/venta/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('venta')
    .select(`
      id,
      fecha,
      total,
      empleado,
      empleados (
        nombre
      ),
      productos_venta (
        producto_id,
        cantidad,
        subtotal,
        medicamentos (
          nombre,
          precio
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) return res.status(500).json(error);

  // Formatear respuesta
  const respuesta = {
    id: data.id,
    fecha: data.fecha,
    total: data.total,
    empleado_id: data.empleado,
    empleado: data.empleados?.nombre || "Sin empleado",
    productos: data.productos_venta.map(p => ({
      id: p.producto_id,
      cantidad: p.cantidad,
      subtotal: p.subtotal,
      nombre: p.medicamentos?.nombre || "Sin nombre",
      precio: p.medicamentos?.precio || 0
    }))
  };

  res.json(respuesta);
});

// Obtener medicamentos
app.get('/medicamentos', async (req, res) => {
  const { data, error } = await supabase
    .from('medicamentos')
    .select('*');

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Agregar medicamento
app.post('/medicamentos', async (req, res) => {
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from('medicamentos')
    .insert([{ nombre, precio, stock }]);

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Actualizar medicamento
app.put('/medicamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;

  const { data, error } = await supabase
    .from('medicamentos')
    .update({ nombre, precio, stock })
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Eliminar medicamento
app.delete('/medicamentos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('medicamentos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ mensaje: 'Eliminado' });
});

// Obtener EMPLEADOS
app.get('/empleados', async (req, res) => {
  const { data, error } = await supabase
    .from('empleados')
    .select('*');

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Agregar EMPLEADOS
app.post('/empleados', async (req, res) => {
  const { nombre, apellidos, turno, rfc, telefono, puesto } = req.body;

  const { data, error } = await supabase
    .from('empleados')
    .insert([{ nombre, apellidos, turno, rfc, telefono, puesto }]);

  if (error) return res.status(500).json(error);
  console.log("BODY RECIBIDO:", data);
  res.json(data);
});

// Actualizar EMPLEADOS
app.put('/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, turno, rfc, telefono, puesto } = req.body;

  const { data, error } = await supabase
    .from('empleados')
    .update({ nombre, apellidos, turno, rfc, telefono, puesto })
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Eliminar EMPLEADOS
app.delete('/empleados/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('empleados')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ mensaje: 'Eliminado' });
});

//REALIZAR VENTA
app.post('/venta', async (req, res) => {
    const { fecha, total, empleado, productos } = req.body;

    try {
        // 1. Crear venta
        const { data: venta, error: errorVenta } = await supabase
            .from('venta')
            .insert([{ fecha, total, empleado }])
            .select()
            .single();

        if (errorVenta) throw errorVenta;

        // 2. Insertar productos y actualizar stock
        for (const p of productos) {

            // Insertar en productos_venta
            const { error: errorDetalle } = await supabase
                .from('productos_venta')
                .insert([{
                    venta_id: venta.id,
                    producto_id: p.id,
                    cantidad: p.cantidad,
                    subtotal: p.subtotal
                }]);

            if (errorDetalle) throw errorDetalle;

            // Obtener stock actual
            const { data: prodActual } = await supabase
                .from('medicamentos')
                .select('stock')
                .eq('id', p.id)
                .single();

            const nuevoStock = prodActual.stock - p.cantidad;

            if (nuevoStock < 0) {
                throw new Error(`Stock insuficiente para producto ${p.id}`);
            }

            // Actualizar stock
            const { error: errorStock } = await supabase
                .from('medicamentos')
                .update({ stock: nuevoStock })
                .eq('id', p.id);

            if (errorStock) throw errorStock;
        }

        res.json({ ok: true, venta });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});




app.use(express.static('public'));

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
/* ============================================================
   Datos mock — Control de Consignación Nuevo Parket
   Todos los datos viven en memoria. El estado global de la app
   (usuario logueado, rol, navegación) lo maneja App.jsx.
   ============================================================ */

const SUCURSALES = ['Quilmes', 'La Plata', 'Gonnet'];

const USUARIOS = [
  { id: 1, slot: 'admin',    nombre: 'Ariel Pérez',   email: 'admin@np.com',    rol: 'admin',    sucursal: null,         inicial: 'AP' },
  { id: 2, slot: 'quilmes',  nombre: 'Carla Gómez',   email: 'quilmes@np.com',  rol: 'vendedor', sucursal: 'Quilmes',    inicial: 'CG' },
  { id: 3, slot: 'laplata',  nombre: 'Diego Ríos',    email: 'laplata@np.com',  rol: 'vendedor', sucursal: 'La Plata',   inicial: 'DR' },
  { id: 4, slot: 'gonnet',   nombre: 'Lucía Méndez',  email: 'gonnet@np.com',   rol: 'vendedor', sucursal: 'Gonnet',     inicial: 'LM' },
];

const PRODUCTOS = [
  { id: 1, nombre: 'Floorpan Fix - Karayael',    activo: true },
  { id: 2, nombre: 'Floorpan Fix - Budgay',      activo: true },
  { id: 3, nombre: 'Floorpan Classic - Dogal',   activo: true },
  { id: 4, nombre: 'Floorpan Classic - Atlas',   activo: true },
  { id: 5, nombre: 'Valvi Green Chakra',         activo: true },
  { id: 6, nombre: 'Valvi SPC JC002-4A',         activo: true },
  { id: 7, nombre: 'SPC Oferta',                 activo: true },
];

// Ingresos (mercadería de All Covering a precio costo)
// estructura: id, productoId, sucursal, cajas, costo, fecha
const INGRESOS = [
  { id: 101, productoId: 1, sucursal: 'Quilmes',  cajas: 80, costo: 9800,  fecha: '2026-02-10' },
  { id: 102, productoId: 2, sucursal: 'Quilmes',  cajas: 60, costo: 10200, fecha: '2026-02-10' },
  { id: 103, productoId: 3, sucursal: 'La Plata', cajas: 50, costo: 11500, fecha: '2026-02-18' },
  { id: 104, productoId: 4, sucursal: 'Gonnet',   cajas: 45, costo: 12400, fecha: '2026-03-02' },
  { id: 105, productoId: 5, sucursal: 'Quilmes',  cajas: 70, costo: 8900,  fecha: '2026-03-12' },
  { id: 106, productoId: 6, sucursal: 'La Plata', cajas: 55, costo: 8500,  fecha: '2026-03-20' },
  { id: 107, productoId: 7, sucursal: 'Gonnet',   cajas: 90, costo: 7200,  fecha: '2026-04-01' },
  { id: 108, productoId: 1, sucursal: 'La Plata', cajas: 30, costo: 9800,  fecha: '2026-04-05' },
];

// Ventas — referencian ingreso para saber el costo.
// estructura: id, ingresoId, cajas, precioVenta, fecha, userId
const VENTAS = [
  { id: 201, ingresoId: 101, cajas: 12, precioVenta: 15800, fecha: '2026-02-22', userId: 2 },
  { id: 202, ingresoId: 101, cajas: 8,  precioVenta: 15800, fecha: '2026-03-05', userId: 2 },
  { id: 203, ingresoId: 103, cajas: 14, precioVenta: 17900, fecha: '2026-03-10', userId: 3 },
  { id: 204, ingresoId: 102, cajas: 10, precioVenta: 16200, fecha: '2026-03-15', userId: 2 },
  { id: 205, ingresoId: 104, cajas: 6,  precioVenta: 19200, fecha: '2026-03-22', userId: 4 },
  { id: 206, ingresoId: 105, cajas: 18, precioVenta: 13900, fecha: '2026-03-28', userId: 2 },
  { id: 207, ingresoId: 107, cajas: 22, precioVenta: 11200, fecha: '2026-04-03', userId: 4 },
  { id: 208, ingresoId: 106, cajas: 12, precioVenta: 12900, fecha: '2026-04-08', userId: 3 },
  { id: 209, ingresoId: 108, cajas: 5,  precioVenta: 15800, fecha: '2026-04-12', userId: 3 },
  { id: 210, ingresoId: 107, cajas: 8,  precioVenta: 11200, fecha: '2026-04-15', userId: 4 },
];

// Bajas (no generan deuda)
const BAJAS = [
  { id: 301, productoId: 1, sucursal: 'Quilmes',  cajas: 2, motivo: 'MUESTRA',     fecha: '2026-03-02' },
  { id: 302, productoId: 4, sucursal: 'Gonnet',   cajas: 1, motivo: 'ROTURA',      fecha: '2026-03-18' },
  { id: 303, productoId: 7, sucursal: 'Gonnet',   cajas: 3, motivo: 'MUESTRA',     fecha: '2026-04-05' },
  { id: 304, productoId: 3, sucursal: 'La Plata', cajas: 1, motivo: 'DONACION',    fecha: '2026-04-10' },
];

// Helpers ------------------------------------------------------

function productoNombre(id) {
  return PRODUCTOS.find(p => p.id === id)?.nombre ?? '—';
}
function usuarioPorId(id) {
  return USUARIOS.find(u => u.id === id);
}
function ingresoPorId(id) {
  return INGRESOS.find(i => i.id === id);
}

// Stock por (producto, sucursal): ingresos − ventas − bajas
function stockActual(sucursalFilter = null) {
  const rows = [];
  for (const p of PRODUCTOS) {
    for (const s of SUCURSALES) {
      if (sucursalFilter && s !== sucursalFilter) continue;
      const ingresadas = INGRESOS
        .filter(i => i.productoId === p.id && i.sucursal === s)
        .reduce((sum, i) => sum + i.cajas, 0);
      const vendidas = VENTAS
        .filter(v => {
          const ing = ingresoPorId(v.ingresoId);
          return ing.productoId === p.id && ing.sucursal === s;
        })
        .reduce((sum, v) => sum + v.cajas, 0);
      const dadas = BAJAS
        .filter(b => b.productoId === p.id && b.sucursal === s)
        .reduce((sum, b) => sum + b.cajas, 0);
      if (ingresadas === 0 && vendidas === 0 && dadas === 0) continue;
      rows.push({
        producto: p.nombre, productoId: p.id, sucursal: s,
        ingresadas, vendidas, dadas,
        disponibles: ingresadas - vendidas - dadas,
      });
    }
  }
  return rows;
}

// Deuda con All Covering = Σ (ventaCajas × costoIngreso)
function deudaTotal() {
  return VENTAS.reduce((sum, v) => {
    const ing = ingresoPorId(v.ingresoId);
    return sum + v.cajas * ing.costo;
  }, 0);
}

// Utilidad bruta = Σ (ventaCajas × (precioVenta − costo))
function utilidadTotal(sucursalFilter = null) {
  return VENTAS.reduce((sum, v) => {
    const ing = ingresoPorId(v.ingresoId);
    if (sucursalFilter && ing.sucursal !== sucursalFilter) return sum;
    return sum + v.cajas * (v.precioVenta - ing.costo);
  }, 0);
}

function ventasPorSucursal() {
  const out = SUCURSALES.map(s => ({ sucursal: s, total: 0, cajas: 0 }));
  for (const v of VENTAS) {
    const ing = ingresoPorId(v.ingresoId);
    const row = out.find(o => o.sucursal === ing.sucursal);
    row.total += v.cajas * v.precioVenta;
    row.cajas += v.cajas;
  }
  return out;
}

function topModelos(n = 5) {
  const map = {};
  for (const v of VENTAS) {
    const ing = ingresoPorId(v.ingresoId);
    const nom = productoNombre(ing.productoId);
    map[nom] = (map[nom] || 0) + v.cajas;
  }
  return Object.entries(map)
    .map(([nombre, cajas]) => ({ nombre, cajas }))
    .sort((a, b) => b.cajas - a.cajas).slice(0, n);
}

function evolucionVentas() {
  // agrupado por semana (ISO-ish) → para el mock agrupo por quincenas
  const map = {};
  for (const v of VENTAS) {
    const d = new Date(v.fecha);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCDate() < 15 ? 'H1' : 'H2'}`;
    map[key] = (map[key] || 0) + v.cajas * v.precioVenta;
  }
  return Object.entries(map).sort().map(([label, total]) => ({ label, total }));
}

function historialMovimientos(filtro = {}) {
  const out = [];
  for (const i of INGRESOS) {
    out.push({
      id: 'I' + i.id, tipo: 'ingreso', fecha: i.fecha, sucursal: i.sucursal,
      producto: productoNombre(i.productoId), cajas: i.cajas,
      detalle: `Costo $${i.costo.toLocaleString('es-AR')} / caja`,
      monto: i.cajas * i.costo,
    });
  }
  for (const v of VENTAS) {
    const ing = ingresoPorId(v.ingresoId);
    const u = usuarioPorId(v.userId);
    out.push({
      id: 'V' + v.id, tipo: 'venta', fecha: v.fecha, sucursal: ing.sucursal,
      producto: productoNombre(ing.productoId), cajas: v.cajas,
      detalle: `Vendió ${u?.nombre ?? '—'} · $${v.precioVenta.toLocaleString('es-AR')}/caja`,
      monto: v.cajas * v.precioVenta,
      utilidad: v.cajas * (v.precioVenta - ing.costo),
    });
  }
  for (const b of BAJAS) {
    out.push({
      id: 'B' + b.id, tipo: 'baja', fecha: b.fecha, sucursal: b.sucursal,
      producto: productoNombre(b.productoId), cajas: b.cajas,
      detalle: `Motivo: ${b.motivo}`,
      monto: 0,
    });
  }
  let filtered = out;
  if (filtro.sucursal && filtro.sucursal !== 'Todas')
    filtered = filtered.filter(r => r.sucursal === filtro.sucursal);
  if (filtro.tipo && filtro.tipo !== 'todos')
    filtered = filtered.filter(r => r.tipo === filtro.tipo);
  return filtered.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Format helpers
function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}
function fmtFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

Object.assign(window, {
  SUCURSALES, USUARIOS, PRODUCTOS, INGRESOS, VENTAS, BAJAS,
  productoNombre, usuarioPorId, ingresoPorId,
  stockActual, deudaTotal, utilidadTotal,
  ventasPorSucursal, topModelos, evolucionVentas, historialMovimientos,
  fmtMoney, fmtFecha,
});

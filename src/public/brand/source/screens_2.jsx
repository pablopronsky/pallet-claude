/* ==========================================================
   Screens — ingresos, ventas, bajas, historial, usuarios, exportar
   ========================================================== */

/* ---------- INGRESOS (admin) ---------- */
function IngresosScreen({ user }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const ingresos = [...INGRESOS].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Mercadería</div>
          <h1 className="page__title">Ingresos de All Covering</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            Mercadería recibida en consignación a precio costo. Genera la deuda contra venta.
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Excel</Button>
          <Button variant="primary" icon={<Icon.Plus/>} onClick={() => setModalOpen(true)}>Nuevo ingreso</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modelo</th>
              <th>Sucursal</th>
              <th className="num">Cajas</th>
              <th className="num">Costo / caja</th>
              <th className="num">Total costo</th>
            </tr>
          </thead>
          <tbody>
            {ingresos.map(i => (
              <tr key={i.id}>
                <td>{fmtFecha(i.fecha)}</td>
                <td className="strong">{productoNombre(i.productoId)}</td>
                <td><SucursalChip sucursal={i.sucursal}/></td>
                <td className="num">{i.cajas}</td>
                <td className="num">{fmtMoney(i.costo)}</td>
                <td className="num strong">{fmtMoney(i.cajas * i.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <IngresoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function IngresoModal({ open, onClose }) {
  const [prod, setProd] = React.useState(PRODUCTOS[0].id);
  const [suc, setSuc] = React.useState(SUCURSALES[0]);
  const [cajas, setCajas] = React.useState(50);
  const [costo, setCosto] = React.useState(10000);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo ingreso de mercadería"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onClose}>Registrar ingreso</Button>
      </>}>
      <div className="form-grid">
        <Field label="Modelo">
          <select className="field__select" value={prod} onChange={e => setProd(+e.target.value)}>
            {PRODUCTOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Sucursal destino">
            <select className="field__select" value={suc} onChange={e => setSuc(e.target.value)}>
              {SUCURSALES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Cantidad de cajas">
            <input className="field__input" type="number" value={cajas} onChange={e => setCajas(+e.target.value)} />
          </Field>
        </div>
        <Field label="Precio costo por caja (ARS)" hint="Este valor define la deuda con All Covering cuando se venda.">
          <input className="field__input" type="number" value={costo} onChange={e => setCosto(+e.target.value)} />
        </Field>
        <div style={{
          padding: '12px 14px', background: 'rgba(71,184,99,0.06)',
          border: '1px solid rgba(71,184,99,0.18)', borderRadius: 2,
          fontSize: 13, color: 'var(--np-fg)'
        }}>
          Total a costo: <strong style={{ color: 'var(--np-green-soft)' }}>{fmtMoney(cajas * costo)}</strong>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- VENTAS (admin + vendedor) ---------- */
function VentasScreen({ user }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const isAdmin = user.rol === 'admin';
  const sucFilter = isAdmin ? null : user.sucursal;

  const ventas = VENTAS
    .filter(v => !sucFilter || ingresoPorId(v.ingresoId).sucursal === sucFilter)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Movimientos</div>
          <h1 className="page__title">Ventas</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            {isAdmin ? 'Todas las ventas de las tres sucursales.' : `Ventas registradas en ${user.sucursal}.`}
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Excel</Button>
          <Button variant="primary" icon={<Icon.Plus/>} onClick={() => setModalOpen(true)}>Registrar venta</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modelo</th>
              <th>Sucursal</th>
              <th>Vendedor</th>
              <th className="num">Cajas</th>
              <th className="num">Precio venta</th>
              <th className="num">Total</th>
              <th className="num">Utilidad</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => {
              const ing = ingresoPorId(v.ingresoId);
              const u = usuarioPorId(v.userId);
              const util = v.cajas * (v.precioVenta - ing.costo);
              return (
                <tr key={v.id}>
                  <td>{fmtFecha(v.fecha)}</td>
                  <td className="strong">{productoNombre(ing.productoId)}</td>
                  <td><SucursalChip sucursal={ing.sucursal}/></td>
                  <td style={{ color: 'var(--np-fg-muted)' }}>{u?.nombre}</td>
                  <td className="num">{v.cajas}</td>
                  <td className="num">{fmtMoney(v.precioVenta)}</td>
                  <td className="num strong">{fmtMoney(v.cajas * v.precioVenta)}</td>
                  <td className="num" style={{ color: 'var(--np-orange)' }}>{fmtMoney(util)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <VentaModal open={modalOpen} onClose={() => setModalOpen(false)} user={user}/>
    </div>
  );
}

function VentaModal({ open, onClose, user }) {
  const [prod, setProd] = React.useState(PRODUCTOS[0].id);
  const [cajas, setCajas] = React.useState(5);
  const [precio, setPrecio] = React.useState(15000);

  const suc = user.rol === 'admin' ? SUCURSALES[0] : user.sucursal;
  // Find an ingreso matching product+sucursal to compute cost preview
  const ing = INGRESOS.find(i => i.productoId === prod && i.sucursal === suc);
  const costo = ing?.costo ?? 0;
  const utilidad = cajas * (precio - costo);

  return (
    <Modal open={open} onClose={onClose} title="Registrar venta"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onClose}>Registrar venta</Button>
      </>}>
      <div className="form-grid">
        <Field label="Modelo" hint={`Sucursal: ${suc} · se toma de tu usuario`}>
          <select className="field__select" value={prod} onChange={e => setProd(+e.target.value)}>
            {PRODUCTOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Cantidad de cajas">
            <input className="field__input" type="number" value={cajas} onChange={e => setCajas(+e.target.value)} />
          </Field>
          <Field label="Precio venta por caja (ARS)">
            <input className="field__input" type="number" value={precio} onChange={e => setPrecio(+e.target.value)} />
          </Field>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: '12px 14px', background: 'rgba(239,127,26,0.06)',
          border: '1px solid rgba(239,127,26,0.2)', borderRadius: 2,
          fontSize: 13, color: 'var(--np-fg)'
        }}>
          <span>Total venta:</span>
          <strong style={{ color: 'var(--np-fg-strong)', textAlign: 'right' }}>{fmtMoney(cajas * precio)}</strong>
          <span>Costo referencia:</span>
          <span style={{ color: 'var(--np-fg-muted)', textAlign: 'right' }}>{fmtMoney(cajas * costo)}</span>
          <span>Utilidad estimada:</span>
          <strong style={{ color: 'var(--np-orange)', textAlign: 'right' }}>{fmtMoney(utilidad)}</strong>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- BAJAS (admin) ---------- */
function BajasScreen({ user }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const bajas = [...BAJAS].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Movimientos</div>
          <h1 className="page__title">Bajas administrativas</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            Muestras, roturas, donaciones. Descuentan stock pero <strong style={{ color: 'var(--np-fg)' }}>no generan deuda</strong>.
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Excel</Button>
          <Button variant="primary" icon={<Icon.Plus/>} onClick={() => setModalOpen(true)}>Registrar baja</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modelo</th>
              <th>Sucursal</th>
              <th className="num">Cajas</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {bajas.map(b => (
              <tr key={b.id}>
                <td>{fmtFecha(b.fecha)}</td>
                <td className="strong">{productoNombre(b.productoId)}</td>
                <td><SucursalChip sucursal={b.sucursal}/></td>
                <td className="num">{b.cajas}</td>
                <td style={{ color: 'var(--np-fg-muted)' }}>{b.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BajaModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function BajaModal({ open, onClose }) {
  const [prod, setProd] = React.useState(PRODUCTOS[0].id);
  const [suc, setSuc] = React.useState(SUCURSALES[0]);
  const [cajas, setCajas] = React.useState(1);
  const [motivo, setMotivo] = React.useState('MUESTRA');
  const motivos = ['MUESTRA', 'ROTURA', 'DONACION', 'VENCIMIENTO', 'OTRO'];

  return (
    <Modal open={open} onClose={onClose} title="Registrar baja"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="orange" onClick={onClose}>Confirmar baja</Button>
      </>}>
      <div className="form-grid">
        <Field label="Modelo">
          <select className="field__select" value={prod} onChange={e => setProd(+e.target.value)}>
            {PRODUCTOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Sucursal">
            <select className="field__select" value={suc} onChange={e => setSuc(e.target.value)}>
              {SUCURSALES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Cajas">
            <input className="field__input" type="number" value={cajas} onChange={e => setCajas(+e.target.value)} />
          </Field>
        </div>
        <Field label="Motivo" hint="Las bajas no generan deuda con el proveedor.">
          <select className="field__select" value={motivo} onChange={e => setMotivo(e.target.value)}>
            {motivos.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

/* ---------- HISTORIAL ---------- */
function HistorialScreen({ user, viewMode, onToggleView }) {
  const isAdmin = user.rol === 'admin';
  const [sucFilter, setSucFilter] = React.useState(isAdmin ? 'Todas' : user.sucursal);
  const [tipoFilter, setTipoFilter] = React.useState('todos');

  const rows = historialMovimientos({
    sucursal: sucFilter,
    tipo: tipoFilter,
  });

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Actividad</div>
          <h1 className="page__title">Historial de movimientos</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            Ingresos, ventas y bajas ordenados por fecha.
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Excel</Button>
        </div>
      </div>

      <div className="filter-bar">
        {isAdmin && <>
          <span className="filter-bar__label">Sucursal</span>
          <select className="field__select" value={sucFilter} onChange={e => setSucFilter(e.target.value)}>
            <option>Todas</option>
            {SUCURSALES.map(s => <option key={s}>{s}</option>)}
          </select>
        </>}
        <span className="filter-bar__label">Tipo</span>
        <select className="field__select" value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="ingreso">Ingresos</option>
          <option value="venta">Ventas</option>
          <option value="baja">Bajas</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="filter-bar__label" style={{ marginRight: 0 }}>Vista</span>
          <div className="role-toggle" style={{ padding: 2 }}>
            <button className={`role-toggle__option ${viewMode === 'tabla' ? 'active' : ''}`} onClick={() => onToggleView('tabla')}>Tabla</button>
            <button className={`role-toggle__option ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => onToggleView('cards')}>Cards</button>
          </div>
        </div>
      </div>

      {viewMode === 'tabla' ? (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>Sucursal</th>
                <th className="num">Cajas</th>
                <th>Detalle</th>
                <th className="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="7"><Empty>Sin movimientos con estos filtros.</Empty></td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{fmtFecha(r.fecha)}</td>
                  <td><Pill tipo={r.tipo}/></td>
                  <td className="strong">{r.producto}</td>
                  <td><SucursalChip sucursal={r.sucursal}/></td>
                  <td className="num">{r.cajas}</td>
                  <td style={{ color: 'var(--np-fg-muted)', fontSize: 12 }}>{r.detalle}</td>
                  <td className="num strong">{r.monto > 0 ? fmtMoney(r.monto) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mov-cards">
          {rows.length === 0 && <Empty>Sin movimientos con estos filtros.</Empty>}
          {rows.map(r => (
            <div key={r.id} className={`mov-card mov-card--${r.tipo}`}>
              <div className="mov-card__top">
                <Pill tipo={r.tipo}/>
                <span className="mov-card__fecha">{fmtFecha(r.fecha)}</span>
              </div>
              <div className="mov-card__producto">{r.producto}</div>
              <div className="mov-card__meta">
                <SucursalChip sucursal={r.sucursal}/> · {r.cajas} cajas
              </div>
              <div style={{ fontSize: 12, color: 'var(--np-fg-muted)', marginTop: 8 }}>{r.detalle}</div>
              {r.monto > 0 && <div className="mov-card__monto">{fmtMoney(r.monto)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- USUARIOS (admin) ---------- */
function UsuariosScreen() {
  const slots = [
    { slot: 'admin',    label: 'Administrador',       sucursal: null,      rol: 'admin' },
    { slot: 'quilmes',  label: 'Vendedor Quilmes',    sucursal: 'Quilmes', rol: 'vendedor' },
    { slot: 'laplata',  label: 'Vendedor La Plata',   sucursal: 'La Plata', rol: 'vendedor' },
    { slot: 'gonnet',   label: 'Vendedor Gonnet',     sucursal: 'Gonnet',   rol: 'vendedor' },
  ];
  const [editing, setEditing] = React.useState(null);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Administración</div>
          <h1 className="page__title">Usuarios</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14, maxWidth: 620 }}>
            El sistema tiene exactamente <strong style={{ color: 'var(--np-fg)' }}>4 slots fijos</strong>: 1 administrador y 1 vendedor por sucursal. No se pueden crear usuarios adicionales — solo editar los existentes.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {slots.map(s => {
          const u = USUARIOS.find(x => x.slot === s.slot);
          return (
            <div key={s.slot} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="user-chip__avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                {u.inicial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--np-fg-muted)', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--np-fg-strong)' }}>{u.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--np-fg-muted)' }}>{u.email}</div>
              </div>
              <Button variant="ghost" onClick={() => setEditing(u)}>Editar</Button>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Editar ${editing.nombre}`}
          footer={<>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setEditing(null)}>Guardar cambios</Button>
          </>}>
          <div className="form-grid">
            <Field label="Nombre completo">
              <input className="field__input" defaultValue={editing.nombre}/>
            </Field>
            <Field label="Email">
              <input className="field__input" type="email" defaultValue={editing.email}/>
            </Field>
            <Field label="Nueva contraseña" hint="Dejá vacío para mantener la actual">
              <input className="field__input" type="password" placeholder="••••••••"/>
            </Field>
            <Field label="Rol">
              <input className="field__input" value={editing.rol.toUpperCase()} disabled style={{ opacity: 0.6 }}/>
            </Field>
            {editing.sucursal && (
              <Field label="Sucursal" hint="Slot fijo — no se puede modificar">
                <input className="field__input" value={editing.sucursal} disabled style={{ opacity: 0.6 }}/>
              </Field>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- EXPORTAR ---------- */
function ExportarScreen() {
  const [running, setRunning] = React.useState(null);

  function run(kind) {
    setRunning(kind);
    setTimeout(() => setRunning(null), 1600);
  }

  const exports = [
    { id: 'stock-xlsx', label: 'Stock actual', fmt: 'Excel', desc: 'Cajas disponibles por modelo y sucursal.' },
    { id: 'ventas-xlsx', label: 'Ventas', fmt: 'Excel', desc: 'Todas las ventas con utilidad desagregada.' },
    { id: 'ingresos-xlsx', label: 'Ingresos de mercadería', fmt: 'Excel', desc: 'Recepciones desde All Covering.' },
    { id: 'bajas-xlsx', label: 'Bajas administrativas', fmt: 'Excel', desc: 'Muestras, roturas y otros.' },
    { id: 'hist-csv', label: 'Historial completo', fmt: 'CSV', desc: 'Todos los movimientos en un solo archivo.' },
    { id: 'dash-pdf', label: 'Dashboard ejecutivo', fmt: 'PDF', desc: 'KPIs + gráficos en un reporte imprimible.' },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Reportes</div>
          <h1 className="page__title">Exportar</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            Descargá datos en Excel, CSV o PDF para contabilidad y gerencia.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {exports.map(e => (
          <div key={e.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: e.fmt === 'PDF' ? 'rgba(239,127,26,0.12)' : e.fmt === 'CSV' ? 'rgba(122,166,255,0.12)' : 'rgba(71,184,99,0.12)',
              color: e.fmt === 'PDF' ? 'var(--np-orange)' : e.fmt === 'CSV' ? '#7aa6ff' : 'var(--np-green-soft)',
              borderRadius: 2, fontFamily: 'var(--np-font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em'
            }}>{e.fmt}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--np-fg-strong)' }}>{e.label}</div>
              <div style={{ fontSize: 12, color: 'var(--np-fg-muted)', marginTop: 2 }}>{e.desc}</div>
            </div>
            <Button variant="ghost" icon={<Icon.Download/>} onClick={() => run(e.id)} disabled={running === e.id}>
              {running === e.id ? 'Generando...' : 'Descargar'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { IngresosScreen, VentasScreen, BajasScreen, HistorialScreen, UsuariosScreen, ExportarScreen });

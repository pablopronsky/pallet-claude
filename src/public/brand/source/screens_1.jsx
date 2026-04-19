/* ==========================================================
   Screens — every top-level route in one file.
   Small-by-design: each screen is ~30-80 lines.
   ========================================================== */

/* ---------- LOGIN ---------- */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('admin@np.com');
  const [password, setPassword] = React.useState('admin123');

  function submit(e) {
    e?.preventDefault();
    const u = USUARIOS.find(u => u.email === email);
    if (u) onLogin(u);
  }
  function use(role) {
    const creds = {
      admin:    { email: 'admin@np.com',    pwd: 'admin123' },
      quilmes:  { email: 'quilmes@np.com',  pwd: 'vend123'  },
      laplata:  { email: 'laplata@np.com',  pwd: 'vend123'  },
      gonnet:   { email: 'gonnet@np.com',   pwd: 'vend123'  },
    }[role];
    setEmail(creds.email); setPassword(creds.pwd);
  }

  return (
    <div className="login">
      <div className="login__hero">
        <div className="login__hero-bg"/>
        <div className="login__hero-scrim"/>
        <div className="login__hero-copy">
          <div className="kicker">Control de Consignación</div>
          <h1>Pisos en consignación<br/>de All Covering.</h1>
          <p style={{ color: 'var(--np-fg-muted)', marginTop: 20, fontSize: 15, lineHeight: 1.6 }}>
            Gestión de stock, ventas y deuda en tiempo real para las tres sucursales de Nuevo Parket.
          </p>
        </div>
      </div>

      <div className="login__panel">
        <div className="login__logo">
          <img src="../../assets/logo-dark.png" alt="Nuevo Parket" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--np-fg-muted)', marginBottom: 10 }}>
            Acceso privado
          </div>
          <h2 style={{ fontFamily: 'var(--np-font-display)', fontWeight: 300, fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
            Ingresá a tu panel
          </h2>
        </div>

        <form onSubmit={submit} className="form-grid" style={{ gap: 18 }}>
          <Field label="Email">
            <input className="field__input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Contraseña">
            <input className="field__input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" className="btn" style={{ padding: '12px 16px', justifyContent: 'center', fontSize: 14, marginTop: 4 }}>
            Entrar
          </Button>
        </form>

        <div className="login__suggest">
          <strong>Usuarios de prueba</strong> — click para auto-completar:
          <div className="login__suggest-row">
            <span>Admin</span>
            <button type="button" onClick={() => use('admin')}>admin@np.com · admin123</button>
          </div>
          <div className="login__suggest-row">
            <span>Quilmes</span>
            <button type="button" onClick={() => use('quilmes')}>quilmes@np.com · vend123</button>
          </div>
          <div className="login__suggest-row">
            <span>La Plata</span>
            <button type="button" onClick={() => use('laplata')}>laplata@np.com · vend123</button>
          </div>
          <div className="login__suggest-row">
            <span>Gonnet</span>
            <button type="button" onClick={() => use('gonnet')}>gonnet@np.com · vend123</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- DASHBOARD ---------- */
function DashboardScreen({ user }) {
  const isAdmin = user.rol === 'admin';
  const sucFilter = isAdmin ? null : user.sucursal;

  const deuda = deudaTotal();
  const utilidad = utilidadTotal(sucFilter);
  const ventasSuc = ventasPorSucursal();
  const top = topModelos(5);
  const evol = evolucionVentas();

  // Stock por sucursal
  const stockPorSuc = SUCURSALES.map(s => {
    const rows = stockActual(s);
    return {
      sucursal: s,
      disp: rows.reduce((a, r) => a + r.disponibles, 0),
      vend: rows.reduce((a, r) => a + r.vendidas, 0),
    };
  });
  const utilidadSuc = SUCURSALES.map(s => ({ sucursal: s, utilidad: utilidadTotal(s) }));

  // Sparkline mock de deuda (últimos 8 puntos escalados a deuda actual)
  const sparkData = [0.35, 0.48, 0.55, 0.62, 0.7, 0.81, 0.92, 1].map(v => deuda * v);

  const totalCajas = VENTAS.reduce((a, v) => a + v.cajas, 0);
  const stockTotal = stockPorSuc.reduce((a, s) => a + s.disp, 0);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Panel general</div>
          <h1 className="page__title">Hola, {user.nombre.split(' ')[0]}.</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            {isAdmin ? 'Estado consolidado de las tres sucursales.' : `Estado de la sucursal ${user.sucursal}.`}
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Exportar PDF</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi kpi--hero">
          <div className="kpi__label">Deuda con All Covering</div>
          <div className="kpi__value">{fmtMoney(deuda)}</div>
          <div className="kpi__sub">Σ (cajas vendidas × costo) · <strong>{totalCajas} cajas</strong> rendidas</div>
          <div className="kpi__trend">
            <Sparkline data={sparkData} width={180} height={48}/>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Utilidad bruta</div>
          <div className="kpi__value" style={{ color: 'var(--np-orange)' }}>{fmtMoney(utilidad)}</div>
          <div className="kpi__sub">Margen sobre ventas {isAdmin ? 'totales' : `en ${user.sucursal}`}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Stock disponible</div>
          <div className="kpi__value">{stockTotal}</div>
          <div className="kpi__sub">cajas · en {isAdmin ? '3 sucursales' : user.sucursal}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="card card--col-8">
          <div className="card__header">
            <div>
              <h3 className="card__title">Evolución de ventas</h3>
              <div className="card__subtitle">Facturación total por quincena</div>
            </div>
          </div>
          <LineChart data={evol}/>
        </div>

        <div className="card card--col-4">
          <div className="card__header">
            <h3 className="card__title">Ventas por sucursal</h3>
          </div>
          <BarChart data={ventasSuc.map(v => ({ label: v.sucursal, total: v.total }))}/>
        </div>

        <div className="card card--col-6">
          <div className="card__header">
            <div>
              <h3 className="card__title">Top 5 modelos más vendidos</h3>
              <div className="card__subtitle">Cajas vendidas en total</div>
            </div>
          </div>
          <HBarChart data={top}/>
        </div>

        <div className="card card--col-6">
          <div className="card__header">
            <h3 className="card__title">Utilidad bruta por sucursal</h3>
          </div>
          <UtilityBars data={utilidadSuc}/>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="card__title" style={{ marginBottom: 14 }}>Stock disponible vs vendido</h3>
            <StackedBars data={stockPorSuc}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- STOCK ---------- */
function StockScreen({ user }) {
  const isAdmin = user.rol === 'admin';
  const [sucFilter, setSucFilter] = React.useState(isAdmin ? 'Todas' : user.sucursal);
  const rows = stockActual(sucFilter === 'Todas' ? null : sucFilter);

  // Agrupar por producto
  const byProduct = {};
  for (const r of rows) {
    if (!byProduct[r.producto]) byProduct[r.producto] = [];
    byProduct[r.producto].push(r);
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__kicker">Inventario</div>
          <h1 className="page__title">Stock actual</h1>
          <p style={{ color: 'var(--np-fg-muted)', margin: '6px 0 0', fontSize: 14 }}>
            Cajas disponibles por modelo y sucursal.{' '}
            <span style={{ color: 'var(--np-fg-faint)' }}>Disponibles = ingresadas − vendidas − bajas.</span>
          </p>
        </div>
        <div className="page__actions">
          <Button variant="ghost" icon={<Icon.Download/>}>Exportar Excel</Button>
        </div>
      </div>

      {isAdmin && (
        <div className="filter-bar">
          <span className="filter-bar__label">Sucursal</span>
          <select className="field__select" value={sucFilter} onChange={e => setSucFilter(e.target.value)}>
            <option>Todas</option>
            {SUCURSALES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Sucursal</th>
              <th className="num">Ingresadas</th>
              <th className="num">Vendidas</th>
              <th className="num">Bajas</th>
              <th className="num">Disponibles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="6"><Empty>Sin movimientos en esta sucursal.</Empty></td></tr>}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="strong">{r.producto}</td>
                <td><SucursalChip sucursal={r.sucursal}/></td>
                <td className="num">{r.ingresadas}</td>
                <td className="num">{r.vendidas}</td>
                <td className="num">{r.dadas}</td>
                <td className="num">
                  <span className={`stock-badge ${r.disponibles < 10 ? 'stock-badge--low' : 'stock-badge--ok'}`}>
                    {r.disponibles}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, DashboardScreen, StockScreen });

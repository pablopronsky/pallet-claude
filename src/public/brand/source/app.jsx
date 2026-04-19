/* ==========================================================
   App shell + router.
   ========================================================== */

const ROUTES = {
  admin: [
    { id: 'dashboard', label: 'Dashboard',           icon: <Icon.Dashboard/> },
    { id: 'stock',     label: 'Stock actual',        icon: <Icon.Box/> },
    { id: 'ingresos',  label: 'Ingresos',            icon: <Icon.TruckIn/> },
    { id: 'ventas',    label: 'Ventas',              icon: <Icon.Cart/> },
    { id: 'bajas',     label: 'Bajas',               icon: <Icon.Minus/> },
    { id: 'historial', label: 'Historial',           icon: <Icon.History/> },
    { id: 'usuarios',  label: 'Usuarios',            icon: <Icon.Users/> },
    { id: 'exportar',  label: 'Exportar',            icon: <Icon.Download/> },
  ],
  vendedor: [
    { id: 'dashboard', label: 'Dashboard',           icon: <Icon.Dashboard/> },
    { id: 'stock',     label: 'Stock sucursal',      icon: <Icon.Box/> },
    { id: 'ventas',    label: 'Ventas',              icon: <Icon.Cart/> },
    { id: 'historial', label: 'Historial',           icon: <Icon.History/> },
  ],
};

const CRUMBS = {
  dashboard: 'Dashboard',
  stock: 'Stock actual',
  ingresos: 'Ingresos',
  ventas: 'Ventas',
  bajas: 'Bajas',
  historial: 'Historial',
  usuarios: 'Usuarios',
  exportar: 'Exportar',
};

function Sidebar({ user, route, onRoute }) {
  const items = ROUTES[user.rol];
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="../../assets/logo-dark.png" alt="Nuevo Parket"/>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--np-fg-faint)', marginTop: 6 }}>
          Consignación
        </div>
      </div>
      <div className="sidebar__label">Menú</div>
      {items.map(item => (
        <div key={item.id}
          className={`nav-item ${route === item.id ? 'active' : ''}`}
          onClick={() => onRoute(item.id)}>
          {item.icon}
          {item.label}
        </div>
      ))}
      <div className="sidebar__footer">
        <div>Nuevo Parket · v0.1</div>
        <div style={{ marginTop: 4, color: 'var(--np-fg-faint)' }}>Proveedor: All Covering SRL</div>
      </div>
    </aside>
  );
}

function Topbar({ user, route, onLogout, onSwitchUser }) {
  return (
    <div className="topbar">
      <div className="topbar__crumb">
        <span>Control de Consignación</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <strong>{CRUMBS[route] ?? ''}</strong>
      </div>

      <div className="topbar__right">
        {/* Role toggle — switches the logged-in user between admin + the three vendedores */}
        <div className="role-toggle" title="Cambiar rol (demo)">
          {USUARIOS.map(u => (
            <button key={u.id}
              className={`role-toggle__option ${user.id === u.id ? 'active' : ''}`}
              onClick={() => onSwitchUser(u)}>
              {u.rol === 'admin' ? 'Admin' : u.sucursal}
            </button>
          ))}
        </div>

        <div className="user-chip" title="Sesión actual">
          <div className="user-chip__avatar">{user.inicial}</div>
          <div>
            <div className="user-chip__name">{user.nombre}</div>
            <div className="user-chip__rol">{user.rol === 'admin' ? 'Administrador' : `Vendedor · ${user.sucursal}`}</div>
          </div>
        </div>

        <Button variant="ghost" icon={<Icon.Logout/>} onClick={onLogout} className="btn--sm">Salir</Button>
      </div>
    </div>
  );
}

function App() {
  // Persist login + route across reloads
  const [user, setUser] = React.useState(() => {
    try {
      const id = +localStorage.getItem('np-user-id');
      return USUARIOS.find(u => u.id === id) || null;
    } catch { return null; }
  });
  const [route, setRoute] = React.useState(() => localStorage.getItem('np-route') || 'dashboard');
  const [histView, setHistView] = React.useState(() => localStorage.getItem('np-histview') || 'tabla');

  React.useEffect(() => {
    if (user) localStorage.setItem('np-user-id', user.id);
    else localStorage.removeItem('np-user-id');
  }, [user]);
  React.useEffect(() => { localStorage.setItem('np-route', route); }, [route]);
  React.useEffect(() => { localStorage.setItem('np-histview', histView); }, [histView]);

  // Vendedor loses access to admin-only routes when switching role
  React.useEffect(() => {
    if (!user) return;
    const allowed = ROUTES[user.rol].map(r => r.id);
    if (!allowed.includes(route)) setRoute('dashboard');
  }, [user, route]);

  if (!user) return <LoginScreen onLogin={setUser}/>;

  let screen;
  switch (route) {
    case 'dashboard': screen = <DashboardScreen user={user}/>; break;
    case 'stock':     screen = <StockScreen user={user}/>; break;
    case 'ingresos':  screen = <IngresosScreen user={user}/>; break;
    case 'ventas':    screen = <VentasScreen user={user}/>; break;
    case 'bajas':     screen = <BajasScreen user={user}/>; break;
    case 'historial': screen = <HistorialScreen user={user} viewMode={histView} onToggleView={setHistView}/>; break;
    case 'usuarios':  screen = <UsuariosScreen/>; break;
    case 'exportar':  screen = <ExportarScreen/>; break;
    default:          screen = <DashboardScreen user={user}/>;
  }

  return (
    <div className="app">
      <Sidebar user={user} route={route} onRoute={setRoute}/>
      <div className="main">
        <Topbar user={user} route={route} onLogout={() => setUser(null)} onSwitchUser={setUser}/>
        {screen}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

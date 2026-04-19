# GEMINI HANDOFF — Sistema de Control de Consignación (Nuevo Parket)

> **Para Google AI Studio / Gemini**: este archivo contiene todo el contexto de diseño en un solo documento.
> 1. El README completo con specs, tokens, reglas de negocio.
> 2. Todo el código fuente del prototipo embebido al final.
> 3. Los screenshots (10 pantallas) están en la carpeta `screenshots/` aparte — subilos también al prompt para que Gemini vea el diseño visual.

---

## PARTE 1 — README DEL HANDOFF

# Handoff: Sistema de Control de Consignación — Nuevo Parket

## Overview
Panel interno para **Nuevo Parket** (pisos y revestimientos, 3 sucursales: Quilmes, La Plata, Gonnet) que gestiona mercadería recibida en **consignación** del proveedor **All Covering SRL**. El sistema resuelve tres necesidades concretas:

1. **Trazabilidad de stock por sucursal** — qué cajas hay, dónde, de qué modelo.
2. **Cálculo automático de la deuda con All Covering** — se genera solo cuando una caja se vende (consignación = se paga lo vendido, no lo recibido).
3. **Visibilidad diferenciada por rol** — el Administrador ve las 3 sucursales consolidadas; cada Vendedor ve solo la suya.

El dominio tiene 3 tipos de movimientos sobre el stock:
- **Ingresos** (All Covering → Nuevo Parket): aumentan stock, **no generan deuda todavía**.
- **Ventas** (Nuevo Parket → Cliente final): bajan stock, **generan deuda contra All Covering** (cajas × costo) y utilidad (precio venta − costo).
- **Bajas administrativas** (muestras, roturas, donaciones): bajan stock, **no generan deuda ni utilidad**.

## About the Design Files
Los archivos en este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran el look-and-feel y comportamiento esperados, **no código de producción para copiar directo**. La tarea es **recrear estos diseños en el entorno del codebase destino** (React/Next, Vue, Rails + Hotwire, Laravel + Livewire, etc.) usando sus patrones, librerías y convenciones establecidas. Si el codebase aún no existe, elegir el stack más apropiado (sugerencia: **Next.js + Tailwind + shadcn/ui** o equivalente — el prototipo usa clases utilitarias-style que mapean 1:1).

El prototipo es **un solo archivo HTML con React via Babel in-browser + CSS plano**; en producción debería ser un SPA/MPA real con backend, autenticación y persistencia en DB.

## Fidelity
**High-fidelity.** Colores, tipografía, espaciado, jerarquía visual, componentes y microcopy (en español rioplatense, "vos") están finalizados. El desarrollador debe recrear la UI con fidelidad de píxel usando los componentes de su design system, manteniendo:

- Colores exactos (ver **Design Tokens**)
- Tipografía **Inter** (400/500/600/700) con **tabular-nums** en números financieros
- Tema **oscuro** como único modo (no hay light mode)
- Verde corporativo `#006730` como color de marca / acción primaria
- Naranja `#f08a1b` reservado **exclusivamente** para valores de utilidad/margen

## Roles y Autorización

El sistema tiene **exactamente 4 slots de usuario fijos**, no se pueden crear ni borrar (requisito del cliente):

| Slot | Rol | Permisos |
|---|---|---|
| Ariel Pérez (admin@np.com) | `admin` | Todo: 3 sucursales, ingresos, bajas, usuarios, exportar |
| Carla Gómez (quilmes@np.com) | `vendedor` (sucursal: Quilmes) | Solo Quilmes; ve Dashboard, Stock, Ventas, Historial |
| Diego Ríos (laplata@np.com) | `vendedor` (sucursal: La Plata) | Solo La Plata; ídem |
| Lucía Méndez (gonnet@np.com) | `vendedor` (sucursal: Gonnet) | Solo Gonnet; ídem |

Password del admin: `admin123`. Vendedores: `vend123`. (En producción, hashear con bcrypt/argon2; éstas son solo mocks de login.)

**Reglas de autorización a implementar en el backend:**
- Vendedores **no pueden**: registrar ingresos, registrar bajas, ver/editar usuarios, exportar reportes globales.
- Vendedores **sí pueden**: registrar ventas (solo de su sucursal), ver stock de su sucursal, ver su historial filtrado.
- Admin puede impersonar/cambiar de vista de sucursal (en el prototipo es el switch del topbar; en producción debería ser un filtro de sucursal, no impersonación real).

## Screens / Views

Hay **10 vistas**, agrupadas en Login + Shell (sidebar + topbar) con 9 rutas internas.

### 0. Login (`/login`)
**Purpose:** Autenticación. Entrada al sistema.

**Layout:** Split 60/40. Izquierda 60%: foto full-bleed (herringbone chair) con scrim oscuro y copy superpuesta. Derecha 40%: panel con formulario.

**Componentes:**
- **Hero (izq)**: foto `photo-herringbone-chair-v2.jpg` a `background-size: cover`, con overlay `linear-gradient(135deg, rgba(10,12,14,0.92), rgba(10,12,14,0.45) 60%, rgba(0,103,48,0.15))` y opacidad `0.55` sobre la foto. Copy inferior: kicker `CONTROL DE CONSIGNACIÓN` (11px, tracking 0.2em, uppercase, verde suave) + H1 "Pisos en consignación de All Covering." (48px, weight 400, line-height 1.1) + párrafo "Gestión de stock, ventas y deuda en tiempo real para las tres sucursales de Nuevo Parket." (14px, gris).
- **Panel login (der)**: fondo `#14181c`, padding 48px. Contiene:
  - Logo `logo-dark.png` (transparente, para fondo oscuro), 140px de ancho.
  - Kicker `ACCESO PRIVADO` + H2 "Ingresá a tu panel" (28px, weight 500).
  - Inputs Email y Contraseña (label uppercase 11px + input de 44px de alto).
  - Botón primario "Entrar" full-width verde `#006730`.
  - Bloque "Usuarios de prueba" con los 4 usuarios en filas clickeables que auto-completan el form. Estilo debug/dev.

**Estados:**
- Hover sobre fila de usuario de prueba: bg `rgba(0,103,48,0.1)`.
- Submit con credenciales inválidas: shake + mensaje rojo "Credenciales incorrectas".
- Submit válido: redirect a `/dashboard`.

### 1. Dashboard (`/dashboard`)
**Purpose:** Vista general del estado del negocio. La **landing después del login**.

**Layout:** Hero de bienvenida + 3 KPI cards en fila + grid 2x2 de gráficos + tabla top-5 modelos.

**Diferencia por rol:**
- **Admin**: saludo "Hola, Ariel.", subtítulo "Estado consolidado de las tres sucursales.", todos los gráficos comparando las 3 sucursales.
- **Vendedor**: saludo "Hola, {nombre}.", subtítulo "Estado de la sucursal {sucursal}.", gráficos filtrados a su sucursal (utilidad y ventas muestran solo su valor).

**KPI Cards (3):**
1. **Deuda con All Covering** (destacada, ancho doble): `$1.060.600` en 44px bold tabular-nums, verde. Caption: `Σ (cajas vendidas × costo) · 115 cajas rendidas`. Línea-gráfico miniatura de tendencia (sparkline) a la derecha.
2. **Utilidad bruta**: `$603.200` en naranja `#f08a1b`, 36px. Caption: "Margen sobre ventas totales".
3. **Stock disponible**: `358` en 36px. Caption: `cajas · en 3 sucursales` (admin) / `cajas · en {sucursal}` (vendedor).

**Gráficos (grid 2x2):**
1. **Evolución de ventas** (line chart, 8 puntos): facturación total por quincena `02/H2 → 04/H2`. Línea verde con dots, grid horizontal, eje Y con ticks `$0, $250.000, $500.000, $750.000, 1.000.000`.
2. **Ventas por sucursal** (bar chart, 3 barras verticales): Quilmes $735.600, La Plata $494.450, Gonnet $416.200 (valores aprox.). Barras verdes, valores arriba, labels abajo.
3. **Top 5 modelos más vendidos** (bar chart horizontal o lista): cajas vendidas por modelo.
4. **Utilidad bruta por sucursal** (bar chart, barras naranjas): Quilmes, La Plata, Gonnet.

**Botón**: "Exportar PDF" en la esquina superior derecha del contenido (solo admin).

### 2. Stock actual (`/stock`)
**Purpose:** Inventario en tiempo real.

**Layout:** Título + descripción + filtro de sucursal + tabla.

**Componentes:**
- Título: `Stock actual` (48px, weight 400).
- Subtítulo: "Cajas disponibles por modelo y sucursal. **Disponibles** = ingresadas − vendidas − bajas." (gris, con la fórmula resaltada).
- Filtro: dropdown "SUCURSAL: [Todas ▾]" (admin) / hidden + forzado a su sucursal (vendedor).
- Tabla con columnas: **Modelo**, **Sucursal** (badge), **Ingresadas**, **Vendidas**, **Bajas**, **Disponibles** (bold, tabular-nums, alineado a derecha).
- Botón superior derecho: "Exportar Excel".

**Filas:** agrupadas por sucursal si filtro = Todas. Badges de sucursal con color distinto por zona (Quilmes amarillo suave, La Plata azul suave, Gonnet rojo suave — ver tokens).

### 3. Ingresos (`/ingresos`) — solo admin
**Purpose:** Registrar y listar recepciones de mercadería desde All Covering.

**Layout:** Título + tabla + botón "+ Nuevo ingreso".

**Tabla:** columnas `Fecha · Modelo · Sucursal · Cajas · Costo/caja · Total costo` (monto bold). Ordenada por fecha descendente.

**Flujo "+ Nuevo ingreso":** modal con form (Fecha · Modelo dropdown · Sucursal dropdown · Cajas number · Costo/caja number). Submit → agrega fila, aumenta stock de esa sucursal.

### 4. Ventas (`/ventas`)
**Purpose:** Registrar y listar ventas al cliente final.

**Tabla:** columnas `Fecha · Modelo · Sucursal · Vendedor · Cajas · Precio venta · Total · Utilidad` (último en naranja).

**Flujo "+ Registrar venta":** modal con (Fecha · Modelo · Sucursal autocompletada si es vendedor · Vendedor autocompletado si es vendedor · Cajas · Precio venta/caja). Submit → baja stock, suma a deuda All Covering, suma utilidad.

**Validación crítica:** no se puede vender más cajas que las disponibles en stock. Mostrar error inline.

### 5. Bajas (`/bajas`) — solo admin
**Purpose:** Registrar cajas que salen del stock sin generar venta ni deuda.

**Tabla:** columnas `Fecha · Modelo · Sucursal · Cajas · Motivo` (badge UPPERCASE: `MUESTRA`, `ROTURA`, `DONACION`).

Subtítulo refuerza: "Muestras, roturas, donaciones. Descuentan stock pero **no generan deuda**."

**Flujo "+ Registrar baja":** similar a ventas pero con dropdown de motivo y **sin** campo de precio.

### 6. Historial (`/historial`)
**Purpose:** Feed unificado de TODOS los movimientos (ingresos + ventas + bajas) ordenados por fecha.

**Filtros:** Sucursal (dropdown) · Tipo (dropdown: Todos / Ingreso / Venta / Baja).

**Tweak destacado (toggle VISTA):** Tabla | Cards
- **Tabla**: densa, columnas `Fecha · Tipo (badge con dot) · Modelo · Sucursal · Cajas · Detalle · Monto`. El detalle concatena info relevante ("Vendió Lucía Méndez · $11.200/caja" para venta, "Costo $7.200/caja" para ingreso, "Motivo: MUESTRA" para baja). Monto con guión (—) para bajas.
- **Cards**: grid 2 columnas, card con **barra lateral izquierda de color** por tipo (verde `#16a34a`=ingreso, ámbar `#f08a1b`=venta, rojo `#dc2626`=baja). Badge del tipo arriba, modelo en bold, fila de badges (sucursal + cajas), detalle en gris, monto en grande abajo.

### 7. Usuarios (`/usuarios`) — solo admin
**Purpose:** Ver y editar los 4 usuarios fijos. **No hay botón "crear" ni "borrar"** — es por diseño.

**Layout:** grid 2x2 de cards. Cada card: avatar circular con iniciales (48px, fondo verde admin / verde claro vendedor) + rol uppercase + nombre + email + botón "Editar".

**Copy del header:** "El sistema tiene exactamente **4 slots fijos**: 1 administrador y 1 vendedor por sucursal. No se pueden crear usuarios adicionales — solo editar los existentes."

**Flujo Editar:** modal con nombre, email, nueva contraseña (opcional). **Rol y sucursal no son editables.**

### 8. Exportar (`/exportar`) — solo admin
**Purpose:** Descarga de reportes.

**Layout:** grid 2x3 de cards, cada una con ícono de formato (Excel verde / CSV azul / PDF rojo) + título + descripción + botón "Descargar".

**Reportes:**
1. Stock actual (Excel)
2. Ventas (Excel)
3. Ingresos de mercadería (Excel)
4. Bajas administrativas (Excel)
5. Historial completo (CSV)
6. Dashboard ejecutivo (PDF, con KPIs + gráficos, imprimible)

### 9. Shell (sidebar + topbar) — presente en 1-8
**Sidebar (240px, fondo `#0f1214`):**
- Top: logo "nuevo parket" (140px) + kicker "CONSIGNACIÓN".
- Middle: label "MENÚ" + items con ícono + texto.
  - **Admin**: Dashboard, Stock actual, Ingresos, Ventas, Bajas, Historial, Usuarios, Exportar.
  - **Vendedor**: Dashboard, Stock sucursal, Ventas, Historial.
- Item activo: fondo `rgba(0,103,48,0.18)`, borde izquierdo verde 3px, texto blanco.
- Item hover: fondo `rgba(255,255,255,0.04)`.
- Bottom: footer "Nuevo Parket · v0.1" + "Proveedor: All Covering SRL" (10px gris oscuro).

**Topbar (64px, fondo `#14181c`, border-bottom `#1f2429`):**
- Izq: breadcrumb "Control de Consignación / {ruta actual}".
- Centro-der: **switch de rol** (botones pill: Admin · Quilmes · La Plata · Gonnet) — rol activo verde relleno, resto outline. Es para demo; en producción esto NO existe, el rol viene de la sesión.
- Der: avatar con iniciales + nombre + rol + botón "Salir".

## Interactions & Behavior

- **Navegación**: click en sidebar cambia ruta. Estado persistido en `localStorage` (`np-route`, `np-user-id`, `np-histview`).
- **Transiciones**: todas 150ms `ease-out`. No hay animaciones complejas.
- **Hover en botones primarios**: oscurecen 6% (`filter: brightness(0.94)`).
- **Modales**: fade-in 200ms, scale 0.98→1. Backdrop `rgba(0,0,0,0.6)` con blur 4px.
- **Tablas**: hover de fila aplica `background: rgba(255,255,255,0.02)`. Sort por click en header (no implementado en prototipo, pendiente).
- **Validación**: inline debajo del campo, rojo `#dc2626`, 12px.
- **Loading states**: skeleton shimmer en tablas (gris `#1f2429` → `#2a3036` → `#1f2429`, 1.5s loop).
- **Responsive**: el prototipo está diseñado para **desktop 1280px+**. Mobile fuera de alcance inicial (pendiente de segunda fase).

## State Management

**Entidades** (nombres sugeridos para el modelo):

```
User { id, name, email, passwordHash, role: 'admin'|'vendedor', sucursalId?: Id, avatarInitials }
Sucursal { id, name: 'Quilmes'|'La Plata'|'Gonnet', color }
Modelo { id, name, proveedor: 'All Covering' }
Ingreso { id, fecha, modeloId, sucursalId, cajas, costoPorCaja, createdBy }
Venta { id, fecha, modeloId, sucursalId, vendedorId, cajas, precioVentaPorCaja, createdBy }
Baja { id, fecha, modeloId, sucursalId, cajas, motivo: 'MUESTRA'|'ROTURA'|'DONACION', createdBy }
```

**Valores derivados** (calcular en queries, no almacenar):
- `stockDisponible(modelo, sucursal) = Σingresos − Σventas − Σbajas`
- `deudaAllCovering = Σ(venta.cajas × ingreso.costoPorCaja_del_modelo)` — ojo: si un modelo tuvo varios ingresos con distinto costo, decidir con el cliente si es **FIFO** o **costo promedio ponderado**. El prototipo usa costo promedio ponderado.
- `utilidad(venta) = venta.cajas × (venta.precioVenta − costoDelModelo)`

**Invariantes:**
- No se puede registrar una venta o baja que lleve `stockDisponible < 0`.
- No se puede borrar un movimiento histórico; solo agregar contra-movimientos.
- Los 4 slots de User son fijos — el endpoint de creación de usuarios **no existe**.

## Design Tokens

### Colores (todos en formato `#rrggbb`)

**Neutrales (fondo y chrome):**
- `--np-bg-base: #0a0c0e` — fondo principal de la app
- `--np-bg-surface: #14181c` — cards, panels, topbar
- `--np-bg-surface-2: #1a1f24` — surfaces anidadas (modales sobre cards)
- `--np-bg-sidebar: #0f1214` — sidebar
- `--np-border: #1f2429` — bordes divisores
- `--np-border-strong: #2a3036` — bordes de inputs

**Texto:**
- `--np-text-primary: #e8ecef` — títulos, valores
- `--np-text-secondary: #9aa4ad` — subtítulos, labels
- `--np-text-tertiary: #5f6b74` — placeholders, footer
- `--np-text-dim: #3f4951` — disabled

**Marca y semánticos:**
- `--np-green: #006730` — verde corporativo, acción primaria
- `--np-green-hover: #00582a`
- `--np-green-soft: #16a34a` — verde claro para badges/ingresos
- `--np-green-bg: rgba(0,103,48,0.18)` — item activo sidebar
- `--np-orange: #f08a1b` — utilidad, margen, **solo** valores de utilidad
- `--np-red: #dc2626` — bajas, errores, destructivo
- `--np-amber: #f08a1b` — ventas en historial cards (reutiliza orange)

**Sucursales (badges):**
- Quilmes: bg `rgba(234,179,8,0.15)`, fg `#eab308`
- La Plata: bg `rgba(59,130,246,0.15)`, fg `#3b82f6`
- Gonnet: bg `rgba(220,38,38,0.15)`, fg `#f87171`

### Tipografía
- **Familia**: Inter (fallback: system-ui, -apple-system, sans-serif)
- **Tabular nums** en TODOS los valores numéricos financieros: `font-variant-numeric: tabular-nums;`
- **Escala**:
  - Display (hero KPI): 44px / weight 400 / line-height 1.0
  - H1 (título de pantalla): 48px / weight 400 / line-height 1.1
  - H2: 28px / weight 500 / line-height 1.2
  - H3 (card title): 18px / weight 500
  - Body: 14px / weight 400 / line-height 1.5
  - Small: 13px / weight 400
  - Kicker/Label: 11px / weight 500 / letter-spacing 0.15em / uppercase
  - Micro (footer, captions): 10px / weight 400 / letter-spacing 0.05em

### Spacing (múltiplos de 4)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

### Radius
- `--radius-sm: 4px` — badges
- `--radius-md: 8px` — inputs, botones
- `--radius-lg: 12px` — cards
- `--radius-xl: 16px` — panels grandes

### Shadows
- No se usan sombras pronunciadas (tema oscuro). Para elevación se usa border o cambio de surface.
- Modal: `box-shadow: 0 24px 64px rgba(0,0,0,0.5)`.

## Assets
Todos dentro de `/assets/` (copiar al codebase destino):
- `logo-dark.png` — logo horizontal "nuevo parket" sobre fondo oscuro (transparente, úsese en sidebar y login).
- `logo-light.png` — variante para fondo claro (reservado para reportes PDF impresos).
- `photo-herringbone-chair-v2.jpg` — hero del login.
- `photo-flotante-interior-v2.jpg`, `photo-deck-exterior-v2.jpg`, `photo-vinilico-interior-v2.jpg`, `photo-revestimiento-pvc.jpg`, `photo-stair.jpg` — imágenes de catálogo (no usadas en pantallas finales, pero disponibles si se quiere agregar una vista de "modelos con foto" en una segunda fase).

**Íconos**: el prototipo usa íconos inline SVG de 18–20px, stroke 1.5. Mapearlos a **lucide-react** / **phosphor** / sistema equivalente del codebase:
- Dashboard → `layout-dashboard`
- Stock → `archive` o `package`
- Ingresos → `truck` o `package-plus`
- Ventas → `shopping-cart`
- Bajas → `minus-circle` o `alert-triangle`
- Historial → `list` o `clock`
- Usuarios → `users`
- Exportar → `download`
- Salir → `log-out`
- Editar → `pencil`

## Files

Archivos fuente del prototipo incluidos en este bundle (en `/source/`):
- `index.html` — shell, imports, carga de React/Babel, bootstrap.
- `app.css` — estilos globales. **Fuente de verdad visual** para tokens y componentes.
- `app.jsx` — componente raíz, routing por state, autenticación mock.
- `ui.jsx` — primitivas: Button, Input, Badge, Card, Modal, Select, Toggle.
- `icons.jsx` — íconos SVG inline.
- `charts.jsx` — LineChart y BarChart custom en SVG (reemplazar por Recharts/Visx en producción).
- `data.jsx` — mock data de usuarios, modelos, ingresos, ventas, bajas.
- `screens_1.jsx` — Login, Dashboard, Stock, Ingresos.
- `screens_2.jsx` — Ventas, Bajas, Historial, Usuarios, Exportar.

## Preguntas Abiertas para el Cliente
1. **Costo para cálculo de deuda**: ¿FIFO o promedio ponderado cuando un modelo tuvo varios ingresos a distinto costo?
2. **Devoluciones a All Covering**: no modeladas en el prototipo. ¿Hay devoluciones de mercadería no vendida? Si sí, es un 4º tipo de movimiento.
3. **Pagos a All Covering**: ¿el sistema necesita registrar cuándo Nuevo Parket paga la deuda (para ver deuda vencida vs. paga), o solo muestra el Σ acumulado?
4. **Moneda**: el prototipo asume ARS. Si hay items en USD (pisos importados), se necesita campo `moneda` + cotización.
5. **Auditoría**: ¿se necesita tracking de quién editó qué campo y cuándo (audit log)?
6. **Mobile**: fuera de alcance v1. ¿Los vendedores en piso de venta necesitan registrar ventas desde celular? Si sí, la versión responsive se vuelve prioridad.


---

## PARTE 2 — CÓDIGO FUENTE DEL PROTOTIPO

Los siguientes archivos son el prototipo HTML/React que sirve de referencia visual y funcional. NO son para copiar directo a producción — son la fuente de verdad del diseño. Recreá la misma UI y comportamiento en el stack destino.


### `source/index.html`

```html
<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Nuevo Parket — Control de Consignación</title>
  <link rel="stylesheet" href="../../colors_and_type.css?v=2"/>
  <link rel="stylesheet" href="app.css?v=2"/>

  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" src="data.jsx"></script>
  <script type="text/babel" src="icons.jsx"></script>
  <script type="text/babel" src="charts.jsx"></script>
  <script type="text/babel" src="ui.jsx"></script>
  <script type="text/babel" src="screens_1.jsx"></script>
  <script type="text/babel" src="screens_2.jsx"></script>
  <script type="text/babel" src="app.jsx"></script>
</body>
</html>

```

### `source/colors_and_type.css`

```css
/* ============================================================
   Nuevo Parket — Colors & Type
   Core tokens for the Nuevo Parket brand.
   Import this file and use the CSS vars for all visual work.
   ============================================================ */

/* Montserrat — uploaded brand variable font, served locally */
@font-face {
  font-family: 'Montserrat';
  src: url('fonts/Montserrat-VariableFont_wght.ttf') format('truetype-variations'),
       url('fonts/Montserrat-VariableFont_wght.ttf') format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

:root {
  /* -------------------------------------------------------
     COLORS
     ------------------------------------------------------- */

  /* Brand core */
  --np-green:        #006730;   /* Primary brand — "parket" green */
  --np-green-hover:  #00552a;   /* Darker hover */
  --np-green-soft:   #0b7a3d;   /* Slightly lighter for on-dark text */
  --np-orange:       #ef7f1a;   /* Secondary accent — used sparingly */
  --np-orange-hover: #d96e10;

  /* Dark neutrals — background hierarchy (app/marketing is dark-first) */
  --np-ink:          #1a1c1f;   /* Deepest — page bg on dark surfaces */
  --np-charcoal:     #24272b;   /* Default dark surface bg */
  --np-charcoal-2:   #2d3135;   /* Elevated surface / cards on dark */
  --np-slate:        #3a3e43;   /* Hairline borders / dividers on dark */

  /* Light neutrals */
  --np-bone:         #f6f5f2;   /* Warm off-white page bg */
  --np-paper:        #ffffff;   /* Pure white */
  --np-sand:         #ece8e1;   /* Soft warm section bg */
  --np-stone:        #c9c6c0;   /* Mid neutral */
  --np-graphite:     #6a6e73;   /* Muted body on light */

  /* Text on dark surfaces */
  --np-fg-strong:    #ffffff;
  --np-fg:           #e7e6e3;
  --np-fg-muted:     #a7a9ad;
  --np-fg-faint:     #6f7378;

  /* Text on light surfaces */
  --np-fg-on-light:        #1a1c1f;
  --np-fg-on-light-muted:  #5a5e63;
  --np-fg-on-light-faint:  #9a9ea3;

  /* Semantic */
  --np-success: var(--np-green);
  --np-warn:    var(--np-orange);
  --np-danger:  #c0392b;
  --np-info:    #3a6b8f;

  /* Scrims / overlays for hero photography */
  --np-scrim-top:    rgba(26, 28, 31, 0.0);
  --np-scrim-bot:    rgba(26, 28, 31, 0.85);

  /* -------------------------------------------------------
     TYPOGRAPHY
     ------------------------------------------------------- */

  /* Families — Montserrat carries the whole system.
     The logo is a custom geometric lowercase wordmark. For all
     supporting copy we use Montserrat at different weights
     (300 light for display, 400/500 for body, 600/700 for UI). */
  --np-font-display: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
  --np-font-sans:    'Montserrat', 'Helvetica Neue', Arial, sans-serif;
  --np-font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Display scale — large hero titles use LIGHT weight (300) to
     match the brochure's airy headings like "Servicios", "Vinilicos SPC" */
  --np-fs-display-xl: clamp(48px, 7vw, 96px);
  --np-fs-display-l:  clamp(40px, 5.5vw, 72px);
  --np-fs-display-m:  clamp(32px, 4vw, 52px);
  --np-fs-display-s:  clamp(26px, 3vw, 38px);

  /* Text scale */
  --np-fs-h1:   32px;
  --np-fs-h2:   24px;
  --np-fs-h3:   20px;
  --np-fs-h4:   17px;
  --np-fs-body: 15px;
  --np-fs-small: 13px;
  --np-fs-tiny:  11px;

  /* Line heights */
  --np-lh-display: 1.02;
  --np-lh-tight:   1.15;
  --np-lh-body:    1.55;
  --np-lh-loose:   1.75;

  /* Tracking */
  --np-tr-eyebrow: 0.18em;  /* "NUESTROS PRODUCTOS" uppercase eyebrow */
  --np-tr-button:  0.04em;
  --np-tr-normal:  0;
  --np-tr-tight:   -0.01em;
  --np-tr-display: -0.02em;

  /* -------------------------------------------------------
     SPACING & LAYOUT
     ------------------------------------------------------- */
  --np-sp-1:  4px;
  --np-sp-2:  8px;
  --np-sp-3:  12px;
  --np-sp-4:  16px;
  --np-sp-5:  24px;
  --np-sp-6:  32px;
  --np-sp-7:  48px;
  --np-sp-8:  64px;
  --np-sp-9:  96px;
  --np-sp-10: 128px;

  --np-container:      1200px;
  --np-container-wide: 1440px;
  --np-gutter:         24px;

  /* -------------------------------------------------------
     RADII
     Nuevo Parket uses minimal rounding — most cards and image
     crops are square or softly rounded. Pills only on badges.
     ------------------------------------------------------- */
  --np-radius-0: 0;
  --np-radius-1: 2px;
  --np-radius-2: 4px;
  --np-radius-3: 8px;
  --np-radius-pill: 999px;

  /* -------------------------------------------------------
     BORDERS & DIVIDERS
     ------------------------------------------------------- */
  --np-border-dark:   1px solid rgba(255, 255, 255, 0.08);
  --np-border-light:  1px solid rgba(26, 28, 31, 0.10);
  --np-divider-accent-w: 40px;   /* The signature short green underline */
  --np-divider-accent-h: 4px;

  /* -------------------------------------------------------
     SHADOWS (used sparingly — Nuevo Parket is flat)
     ------------------------------------------------------- */
  --np-shadow-sm: 0 1px 2px rgba(0,0,0,0.25);
  --np-shadow-md: 0 8px 24px rgba(0,0,0,0.30);
  --np-shadow-lg: 0 24px 48px rgba(0,0,0,0.40);

  /* -------------------------------------------------------
     MOTION
     ------------------------------------------------------- */
  --np-ease:        cubic-bezier(0.22, 0.61, 0.36, 1);
  --np-ease-out:    cubic-bezier(0.16, 1, 0.30, 1);
  --np-dur-fast:    120ms;
  --np-dur-med:     240ms;
  --np-dur-slow:    480ms;
}

/* ============================================================
   SEMANTIC TYPOGRAPHY CLASSES
   ============================================================ */

.np-eyebrow {
  font-family: var(--np-font-sans);
  font-weight: 500;
  font-size: var(--np-fs-small);
  letter-spacing: var(--np-tr-eyebrow);
  text-transform: uppercase;
  color: var(--np-fg-muted);
}

/* Hero display — airy, light-weight. Used for "Servicios", section
   titles in the brochure. Often a two-tone: first word green, second white. */
.np-display {
  font-family: var(--np-font-display);
  font-weight: 300;
  font-size: var(--np-fs-display-l);
  line-height: var(--np-lh-display);
  letter-spacing: var(--np-tr-display);
  color: var(--np-fg-strong);
}
.np-display--xl { font-size: var(--np-fs-display-xl); }
.np-display--m  { font-size: var(--np-fs-display-m); }
.np-display--s  { font-size: var(--np-fs-display-s); }

/* The two-tone accent split used in brochure headings. */
.np-display .accent,
.np-accent { color: var(--np-green); }

/* On dark background a softer green is more legible. */
.np-on-dark .np-accent,
.np-on-dark .np-display .accent { color: var(--np-green-soft); }

h1, .np-h1 {
  font-family: var(--np-font-sans);
  font-weight: 600;
  font-size: var(--np-fs-h1);
  line-height: var(--np-lh-tight);
  letter-spacing: var(--np-tr-tight);
}
h2, .np-h2 {
  font-family: var(--np-font-sans);
  font-weight: 600;
  font-size: var(--np-fs-h2);
  line-height: var(--np-lh-tight);
}
h3, .np-h3 {
  font-family: var(--np-font-sans);
  font-weight: 500;
  font-size: var(--np-fs-h3);
  line-height: var(--np-lh-tight);
}
h4, .np-h4 {
  font-family: var(--np-font-sans);
  font-weight: 600;
  font-size: var(--np-fs-h4);
  line-height: var(--np-lh-tight);
}

body, p, .np-body {
  font-family: var(--np-font-sans);
  font-weight: 400;
  font-size: var(--np-fs-body);
  line-height: var(--np-lh-body);
}
.np-body--loose { line-height: var(--np-lh-loose); }
.np-small { font-size: var(--np-fs-small); line-height: 1.5; }
.np-tiny  { font-size: var(--np-fs-tiny);  line-height: 1.4; }

/* The giant item-number numerals that sit beside each list item
   in the catalog ("01.", "02.", ...) — light weight, generous. */
.np-list-numeral {
  font-family: var(--np-font-display);
  font-weight: 300;
  font-size: 44px;
  line-height: 1;
  color: var(--np-fg-strong);
  letter-spacing: -0.02em;
}

/* The signature short green underline that sits below titles
   and every numbered item in the catalog. */
.np-rule {
  display: block;
  width: var(--np-divider-accent-w);
  height: var(--np-divider-accent-h);
  background: var(--np-green);
  margin-top: 8px;
  border: 0;
}
.np-on-dark .np-rule { background: var(--np-green-soft); }

/* Faded background wordmark used on section pages (huge "NP" watermark) */
.np-watermark {
  position: absolute;
  inset: 0;
  font-family: var(--np-font-display);
  font-weight: 700;
  font-size: 40vw;
  color: rgba(255,255,255,0.025);
  pointer-events: none;
  user-select: none;
  line-height: 0.8;
  letter-spacing: -0.06em;
  overflow: hidden;
}

```

### `source/app.css`

```css
/* App-level CSS on top of colors_and_type.css.
   Admin dashboard feel: dense, dark charcoal, accent green.
   All metrics legible at desktop scale.
*/

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  background: var(--np-ink);
  color: var(--np-fg-strong);
  font-family: var(--np-font-sans);
  font-size: 14px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }

/* ============ APP SHELL ============ */
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.app--login { grid-template-columns: 1fr; }

/* ============ SIDEBAR ============ */
.sidebar {
  background: #101215;
  border-right: 1px solid rgba(255,255,255,0.06);
  padding: 24px 0;
  display: flex; flex-direction: column;
}
.sidebar__brand {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 16px;
}
.sidebar__brand img { height: 28px; display: block; }
.sidebar__label {
  padding: 18px 24px 6px;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--np-fg-faint);
}
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 24px;
  color: var(--np-fg); font-size: 14px; font-weight: 500;
  cursor: pointer; border-left: 3px solid transparent;
  transition: background-color 120ms var(--np-ease), color 120ms var(--np-ease);
}
.nav-item:hover { background: rgba(255,255,255,0.03); color: var(--np-fg-strong); }
.nav-item.active {
  background: rgba(0,103,48,0.12);
  color: var(--np-fg-strong);
  border-left-color: var(--np-green-soft);
}
.nav-item__icon {
  width: 20px; height: 20px; flex-shrink: 0;
  stroke-width: 1.6;
}
.sidebar__footer {
  margin-top: auto;
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 11px; color: var(--np-fg-faint);
}

/* ============ TOPBAR ============ */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  height: 64px; background: #14161a;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky; top: 0; z-index: 10;
}
.topbar__crumb {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: var(--np-fg-muted);
}
.topbar__crumb strong { color: var(--np-fg-strong); font-weight: 500; }
.topbar__right { display: flex; align-items: center; gap: 16px; }
.user-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 12px 6px 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 999px; cursor: pointer;
}
.user-chip__avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--np-green); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 11px; letter-spacing: 0.05em;
}
.user-chip__name { font-size: 13px; font-weight: 500; color: var(--np-fg-strong); }
.user-chip__rol { font-size: 11px; color: var(--np-fg-muted); }

/* Role toggle */
.role-toggle {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 2px; padding: 3px;
}
.role-toggle__option {
  padding: 6px 12px; font-size: 12px; font-weight: 500;
  color: var(--np-fg-muted); cursor: pointer; border-radius: 1px;
  transition: all 120ms var(--np-ease);
  background: transparent; border: 0;
  display: flex; align-items: center; gap: 8px;
  white-space: nowrap;
}
.role-toggle__option.active {
  background: var(--np-green);
  color: #fff;
}
.role-toggle__option:not(.active):hover {
  color: var(--np-fg-strong);
}

/* ============ MAIN ============ */
.main { background: var(--np-ink); display: flex; flex-direction: column; }
.page { padding: 32px 40px 64px; max-width: 1400px; width: 100%; }
.page__header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 28px; gap: 24px;
}
.page__title {
  font-family: var(--np-font-display); font-weight: 300;
  font-size: 40px; line-height: 1; letter-spacing: -0.02em;
  margin: 0; color: var(--np-fg-strong);
}
.page__title .accent { color: var(--np-green-soft); }
.page__kicker {
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--np-fg-muted); margin-bottom: 8px;
}
.page__actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* ============ BUTTONS ============ */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 16px; font-size: 13px; font-weight: 500;
  letter-spacing: 0.01em; border-radius: 2px; border: 0;
  cursor: pointer; transition: all 120ms var(--np-ease);
  white-space: nowrap;
}
.btn--primary { background: var(--np-green); color: #fff; }
.btn--primary:hover { background: var(--np-green-hover); }
.btn--orange { background: var(--np-orange); color: #fff; }
.btn--orange:hover { background: var(--np-orange-hover); }
.btn--ghost { background: transparent; color: var(--np-fg); border: 1px solid rgba(255,255,255,0.12); }
.btn--ghost:hover { background: rgba(255,255,255,0.04); color: var(--np-fg-strong); border-color: rgba(255,255,255,0.24); }
.btn--danger { background: transparent; color: #ff6b6b; border: 1px solid rgba(255,107,107,0.3); }
.btn--danger:hover { background: rgba(255,107,107,0.08); border-color: rgba(255,107,107,0.5); }
.btn--sm { padding: 6px 10px; font-size: 12px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ============ KPI CARDS ============ */
.kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.kpi {
  background: var(--np-charcoal-2);
  border: 1px solid rgba(255,255,255,0.05);
  padding: 20px 22px; border-radius: 2px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative; overflow: hidden;
}
.kpi--hero {
  background: linear-gradient(135deg, #0a1f12, #0f2a18);
  border-color: rgba(71,184,99,0.2);
  grid-column: span 2;
}
.kpi__label {
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--np-fg-muted); font-weight: 500;
}
.kpi__value {
  font-family: var(--np-font-display); font-weight: 300;
  font-size: 40px; line-height: 1; letter-spacing: -0.02em;
  color: var(--np-fg-strong);
}
.kpi--hero .kpi__value { font-size: 56px; color: #e8f5ee; }
.kpi__sub { font-size: 12px; color: var(--np-fg-muted); }
.kpi__sub strong { color: var(--np-fg); font-weight: 500; }
.kpi__trend { position: absolute; right: 22px; bottom: 20px; opacity: 0.6; }

/* ============ CHART CARDS ============ */
.chart-grid {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px;
}
.card {
  background: var(--np-charcoal-2);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 2px;
  padding: 20px 22px;
}
.card__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 18px;
}
.card__title { font-size: 15px; font-weight: 500; color: var(--np-fg-strong); margin: 0; }
.card__subtitle { font-size: 12px; color: var(--np-fg-muted); margin-top: 2px; }

.card--col-8 { grid-column: span 8; }
.card--col-6 { grid-column: span 6; }
.card--col-4 { grid-column: span 4; }
.card--col-12 { grid-column: span 12; }

/* ============ TABLE ============ */
.table {
  width: 100%; border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left; font-weight: 500; font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--np-fg-muted); padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: var(--np-fg);
}
.table tbody tr:hover td { background: rgba(255,255,255,0.02); }
.table td.num, .table th.num { text-align: right; font-variant-numeric: tabular-nums; }
.table td.strong { color: var(--np-fg-strong); font-weight: 500; }

/* Type pills for mov list */
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
  padding: 3px 8px; border-radius: 2px;
  text-transform: uppercase;
}
.pill--ingreso { background: rgba(71, 184, 99, 0.12); color: #7dd598; }
.pill--venta   { background: rgba(239, 127, 26, 0.14); color: #ffad5c; }
.pill--baja    { background: rgba(255, 107, 107, 0.12); color: #ff8080; }
.pill--dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ============ FORMS ============ */
.form-grid { display: grid; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field__label {
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--np-fg-muted); font-weight: 500;
}
.field__input, .field__select {
  background: var(--np-ink);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--np-fg-strong);
  font-family: var(--np-font-sans); font-size: 14px;
  padding: 10px 12px; border-radius: 2px;
  transition: border-color 120ms;
}
.field__input:focus, .field__select:focus {
  outline: 0; border-color: var(--np-green-soft);
}
.field__hint { font-size: 11px; color: var(--np-fg-faint); }

/* ============ LOGIN ============ */
.login {
  min-height: 100vh;
  display: grid; grid-template-columns: 1fr 440px;
  background: var(--np-ink);
}
.login__hero {
  position: relative; overflow: hidden;
  background: #0a0c0e;
  display: flex; align-items: flex-end;
  padding: 48px;
}
.login__hero-bg {
  position: absolute; inset: 0;
  background-image: url('../../assets/photo-herringbone-chair-v2.jpg');
  background-size: cover; background-position: center;
  opacity: 0.55;
}
.login__hero-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(10,12,14,0.92), rgba(10,12,14,0.45) 60%, rgba(0,103,48,0.15));
}
.login__hero-copy { position: relative; z-index: 1; max-width: 420px; }
.login__hero-copy .kicker {
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--np-green-soft); margin-bottom: 16px;
}
.login__hero-copy h1 {
  font-family: var(--np-font-display); font-weight: 300;
  font-size: 56px; line-height: 1.05; letter-spacing: -0.02em;
  margin: 0 0 8px; color: #fff;
}
.login__panel {
  display: flex; flex-direction: column; justify-content: center;
  padding: 48px 56px;
  background: var(--np-charcoal);
  border-left: 1px solid rgba(255,255,255,0.06);
}
.login__logo img { height: 36px; margin-bottom: 48px; }
.login__suggest {
  background: rgba(71,184,99,0.06);
  border: 1px solid rgba(71,184,99,0.18);
  padding: 14px 16px; border-radius: 2px;
  margin-top: 12px; font-size: 12px; color: var(--np-fg);
  line-height: 1.6;
}
.login__suggest strong { color: var(--np-green-soft); font-weight: 500; }
.login__suggest-row {
  display: flex; justify-content: space-between; margin-top: 6px;
  font-family: var(--np-font-mono); font-size: 11px;
  color: var(--np-fg-muted);
}
.login__suggest-row button {
  background: transparent; border: 0; color: var(--np-green-soft);
  font-family: inherit; font-size: inherit; cursor: pointer;
  padding: 0;
}
.login__suggest-row button:hover { text-decoration: underline; }

/* ============ MOV CARDS (tweak) ============ */
.mov-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.mov-card {
  background: var(--np-charcoal-2);
  border: 1px solid rgba(255,255,255,0.05);
  border-left: 3px solid var(--np-green-soft);
  padding: 16px 18px; border-radius: 2px;
}
.mov-card--venta { border-left-color: var(--np-orange); }
.mov-card--baja  { border-left-color: #ff6b6b; }
.mov-card__top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.mov-card__fecha { font-size: 11px; color: var(--np-fg-faint); }
.mov-card__producto { font-size: 15px; font-weight: 500; color: var(--np-fg-strong); margin-bottom: 4px; }
.mov-card__meta { font-size: 12px; color: var(--np-fg-muted); }
.mov-card__monto {
  font-family: var(--np-font-display); font-weight: 300; font-size: 22px;
  color: var(--np-fg-strong); margin-top: 8px;
}

/* ============ MODAL ============ */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(5,6,8,0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 160ms var(--np-ease);
}
@keyframes fadeIn { from { opacity: 0; } }
.modal {
  background: var(--np-charcoal);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  width: min(560px, 92vw);
  max-height: 90vh; overflow: auto;
  animation: slideUp 200ms var(--np-ease);
}
@keyframes slideUp { from { transform: translateY(12px); opacity: 0; } }
.modal__header {
  padding: 22px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; align-items: center;
}
.modal__title { font-size: 18px; font-weight: 500; margin: 0; }
.modal__close {
  background: transparent; border: 0; color: var(--np-fg-muted);
  font-size: 22px; cursor: pointer; line-height: 1;
}
.modal__body { padding: 24px 28px; }
.modal__footer {
  padding: 16px 28px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: flex-end; gap: 10px;
}

/* ============ EMPTY STATE ============ */
.empty {
  padding: 48px; text-align: center;
  color: var(--np-fg-muted); font-size: 14px;
}

/* ============ FILTER BAR ============ */
.filter-bar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  padding: 14px 16px;
  background: var(--np-charcoal-2);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 2px; margin-bottom: 20px;
}
.filter-bar__label {
  font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--np-fg-muted);
  margin-right: 4px;
}
.filter-bar .field__select { padding: 6px 10px; font-size: 13px; }

/* ============ BADGE STOCK ============ */
.stock-badge {
  display: inline-flex; gap: 4px; align-items: center;
  font-variant-numeric: tabular-nums; font-weight: 500;
}
.stock-badge--low { color: #ff8080; }
.stock-badge--ok  { color: var(--np-fg-strong); }

/* ============ SUCURSAL CHIP ============ */
.suc-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; padding: 2px 8px; border-radius: 2px;
  background: rgba(255,255,255,0.06); color: var(--np-fg);
  letter-spacing: 0.04em;
}
.suc-chip::before {
  content: ""; width: 5px; height: 5px; border-radius: 50%;
  background: var(--np-green-soft);
}
.suc-chip--laplata::before { background: #ffad5c; }
.suc-chip--gonnet::before  { background: #7aa6ff; }

```

### `source/data.jsx`

```jsx
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

```

### `source/icons.jsx`

```jsx
/* ==========================================================
   Icons — inline SVG, Lucide-style stroke.
   Keep stroke-width=1.6 to match overall weight.
   ========================================================== */

const Icon = {
  Dashboard: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Box: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" />
    </svg>
  ),
  TruckIn: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
    </svg>
  ),
  Cart: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      <circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/>
    </svg>
  ),
  Minus: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18M6 12h12M9 17h6" />
    </svg>
  ),
  History: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2"/>
    </svg>
  ),
  Users: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Download: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3"/>
    </svg>
  ),
  Logout: () => (
    <svg className="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <path d="M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  Arrow: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
};

Object.assign(window, { Icon });

```

### `source/ui.jsx`

```jsx
/* ==========================================================
   UI primitives shared across screens.
   ========================================================== */

function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled, className = '', ...rest }) {
  const cls = `btn btn--${variant} ${className}`;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {icon}{children}
    </button>
  );
}

function SucursalChip({ sucursal }) {
  const mod = sucursal === 'La Plata' ? 'laplata' : sucursal === 'Gonnet' ? 'gonnet' : 'quilmes';
  return <span className={`suc-chip suc-chip--${mod}`}>{sucursal}</span>;
}

function Pill({ tipo }) {
  return (
    <span className={`pill pill--${tipo}`}>
      <span className="pill--dot" />
      {tipo}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

function Empty({ children = 'Sin datos todavía.' }) {
  return <div className="empty">{children}</div>;
}

Object.assign(window, { Button, SucursalChip, Pill, Field, Modal, Empty });

```

### `source/charts.jsx`

```jsx
/* ==========================================================
   Charts — minimal, inline SVG. Hand-rolled instead of Recharts
   so we have full control over the dark charcoal + green aesthetic
   and don't pay for a library we barely use.
   All charts take plain data arrays and a width/height.
   ========================================================== */

// --- shared ---
const GREEN = 'var(--np-green)';
const GREEN_SOFT = 'var(--np-green-soft)';
const ORANGE = 'var(--np-orange)';
const BLUE = '#7aa6ff';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = 'rgba(255,255,255,0.3)';
const LABEL = '#a7a9ad';

function niceMax(max) {
  if (max <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / mag;
  let r;
  if (n <= 1) r = 1; else if (n <= 2) r = 2; else if (n <= 5) r = 5; else r = 10;
  return r * mag;
}

// --- Bar chart (vertical) — ventas por sucursal ---
function BarChart({ data, valueKey = 'total', labelKey = 'label', format = fmtMoney, height = 240 }) {
  const width = 520;
  const padL = 56, padR = 16, padT = 16, padB = 40;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = niceMax(Math.max(...data.map(d => d[valueKey])));
  const barW = innerW / data.length * 0.56;
  const step = innerW / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {/* grid */}
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return <g key={i}>
          <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={GRID} />
          <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill={LABEL}>
            {i === 0 ? '0' : format(t).replace('$', '$')}
          </text>
        </g>;
      })}
      {data.map((d, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const h = (d[valueKey] / max) * innerH;
        const y = padT + innerH - h;
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={h} fill={GREEN} rx="1" />
          <rect x={x} y={y} width={barW} height="3" fill={GREEN_SOFT} />
          <text x={x + barW / 2} y={padT + innerH + 20} textAnchor="middle" fontSize="11" fill="#e7e6e3" fontWeight="500">
            {d[labelKey]}
          </text>
          <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="10" fill={LABEL}>
            {format(d[valueKey])}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Horizontal bar chart — top modelos ---
function HBarChart({ data, valueKey = 'cajas', labelKey = 'nombre', height = 240 }) {
  const width = 520;
  const padL = 180, padR = 40, padT = 8, padB = 8;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = niceMax(Math.max(...data.map(d => d[valueKey])));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.2;
        const h = rowH * 0.6;
        const w = (d[valueKey] / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="11" fill="#e7e6e3">
            {d[labelKey]}
          </text>
          <rect x={padL} y={y} width={innerW} height={h} fill="rgba(255,255,255,0.03)" rx="1" />
          <rect x={padL} y={y} width={w} height={h} fill={GREEN} rx="1" />
          <text x={padL + w + 8} y={y + h / 2 + 4} fontSize="11" fill="#e7e6e3" fontWeight="500">
            {d[valueKey]}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Line chart — evolución temporal ---
function LineChart({ data, height = 240 }) {
  const width = 520;
  const padL = 56, padR = 20, padT = 20, padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = niceMax(Math.max(...data.map(d => d.total)));

  const points = data.map((d, i) => {
    const x = padL + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padT + innerH - (d.total / max) * innerH;
    return { x, y, d };
  });

  const path = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const area = `${path} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={GREEN_SOFT} stopOpacity="0.3"/>
          <stop offset="1" stopColor={GREEN_SOFT} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return <g key={i}>
          <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={GRID} />
          <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill={LABEL}>
            {i === 0 ? '0' : fmtMoney(t)}
          </text>
        </g>;
      })}
      <path d={area} fill="url(#areaG)" />
      <path d={path} fill="none" stroke={GREEN_SOFT} strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={GREEN_SOFT} stroke="var(--np-charcoal-2)" strokeWidth="2"/>
          <text x={p.x} y={padT + innerH + 20} textAnchor="middle" fontSize="10" fill={LABEL}>
            {p.d.label.replace('2026-', '').replace('-', '/')}
          </text>
        </g>
      ))}
    </svg>
  );
}

// --- Sparkline (deuda) ---
function Sparkline({ data, height = 60, width = 220, color = GREEN_SOFT }) {
  const padY = 8;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + (height - padY*2) * (1 - (v - min) / range);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// --- Utility bars — utilidad por sucursal (compact) ---
function UtilityBars({ data, height = 180 }) {
  const width = 520;
  const padL = 100, padR = 60, padT = 10, padB = 10;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = niceMax(Math.max(...data.map(d => d.utilidad)));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.25;
        const h = rowH * 0.5;
        const w = (d.utilidad / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="12" fill="#e7e6e3" fontWeight="500">
            {d.sucursal}
          </text>
          <rect x={padL} y={y} width={innerW} height={h} fill="rgba(255,255,255,0.03)" rx="1" />
          <rect x={padL} y={y} width={w} height={h} fill={ORANGE} rx="1" />
          <text x={padL + innerW + 8} y={y + h / 2 + 4} fontSize="11" fill="#e7e6e3" fontWeight="500">
            {fmtMoney(d.utilidad)}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Stacked bar — stock disponible vs vendido por sucursal ---
function StackedBars({ data, height = 180 }) {
  const width = 520;
  const padL = 90, padR = 20, padT = 28, padB = 10;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = Math.max(...data.map(d => d.disp + d.vend));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {/* legend */}
      <g>
        <rect x={padL} y="6" width="10" height="10" fill={GREEN} />
        <text x={padL + 16} y="15" fontSize="11" fill={LABEL}>Disponibles</text>
        <rect x={padL + 110} y="6" width="10" height="10" fill={ORANGE} />
        <text x={padL + 126} y="15" fontSize="11" fill={LABEL}>Vendidas</text>
      </g>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.22;
        const h = rowH * 0.56;
        const wDisp = (d.disp / max) * innerW;
        const wVend = (d.vend / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="12" fill="#e7e6e3" fontWeight="500">
            {d.sucursal}
          </text>
          <rect x={padL} y={y} width={wDisp} height={h} fill={GREEN} />
          <rect x={padL + wDisp} y={y} width={wVend} height={h} fill={ORANGE} />
          <text x={padL + wDisp / 2} y={y + h / 2 + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="500">
            {d.disp}
          </text>
          {wVend > 32 && (
            <text x={padL + wDisp + wVend / 2} y={y + h / 2 + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="500">
              {d.vend}
            </text>
          )}
        </g>;
      })}
    </svg>
  );
}

Object.assign(window, { BarChart, HBarChart, LineChart, Sparkline, UtilityBars, StackedBars });

```

### `source/screens_1.jsx`

```jsx
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

```

### `source/screens_2.jsx`

```jsx
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

```

### `source/app.jsx`

```jsx
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

```

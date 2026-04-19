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

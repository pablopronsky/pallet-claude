# Nuevo Parket — Control de Consignación

Aplicación web para gestionar el stock en consignación entregado por **All Covering SRL**
a Nuevo Parket, con control de ingresos, ventas, bajas, deuda con el proveedor y
utilidad bruta por sucursal.

Toda la interfaz, mensajes y comentarios del sistema están en español argentino.

---

## Funcionalidades

### Operación
- **Ingresos** (admin): cargar mercadería con producto, sucursal, cantidad y costo por caja.
- **Ventas** (admin + vendedor): registrar venta. La sucursal se toma del usuario logueado
  (el admin puede elegirla). El stock se descuenta automáticamente por **FIFO** sobre los
  ingresos disponibles, manteniendo la trazabilidad del precio de costo.
- **Bajas** (admin): retirar cajas por muestras, roturas, donaciones, vencimiento u otro
  motivo. **No generan deuda** con el proveedor.
- **Modelos** (admin): alta y activación/desactivación de productos.
- **Usuarios** (admin): editar los 4 slots fijos (admin + 1 vendedor por sucursal). No se
  pueden crear ni eliminar usuarios.

### Visualización
- **Stock actual**: tabla por sucursal y modelo. Vendedores ven solo su sucursal.
- **Movimientos**: historial unificado con filtros por fecha, sucursal, modelo y tipo.
- **Dashboard**: métricas (deuda con All Covering, utilidad bruta, total facturado, cajas
  ingresadas, vendidas, en stock y de baja) + 3 gráficos (ventas por sucursal, top 5
  modelos, evolución mensual).

### Exportaciones
- Cualquier tabla → **Excel (.xlsx)** y **CSV** con un click (xlsx / SheetJS).
- Dashboard completo → **PDF** con métricas, ventas por sucursal, top modelos, evolución
  mensual y stock detallado (@react-pdf/renderer).

### Reglas de negocio implementadas
- `deuda_total = Σ (venta.cantidadCajas × ingreso.precioCostoPorCaja)`
- `utilidad_bruta = Σ venta.cantidadCajas × (venta.precioVenta − ingreso.precioCosto)`
- Las **bajas no afectan la deuda**, solo descuentan stock.
- Sucursales fijas: **Quilmes**, **La Plata**, **Gonnet**.
- Usuarios fijos: 4 slots, 1 admin + 1 vendedor por sucursal.

---

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript estricto
- Tailwind CSS + componentes shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth.js v5 (Credentials Provider)
- Zod para validaciones (cliente + servidor)
- Recharts (gráficos), @react-pdf/renderer (PDF), SheetJS xlsx (Excel/CSV)

---

## Requisitos previos

- **Node.js** 20 o superior
- **PostgreSQL** 14 o superior (local o remoto, ej: Supabase)
- **npm** 10 o superior

---

## Instalación paso a paso

### 1. Instalar dependencias

```bash
npm install
```

> Si algún peer dep tira conflicto (raro con estas versiones), corré
> `npm install --legacy-peer-deps`.

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editá `.env`:

- `DATABASE_URL` — PostgreSQL local o cualquier URL externa (Supabase, Neon, Railway).
- `AUTH_SECRET` — generá uno con `npx auth secret` u `openssl rand -base64 32`.
- `AUTH_URL` — `http://localhost:3000` para desarrollo.

### 3. Crear la base y aplicar el schema

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

El seed crea los 4 usuarios fijos y 5 productos de ejemplo. Es idempotente, podés
correrlo varias veces sin duplicar.

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## Cuentas de prueba

| Rol       | Sucursal  | Email             | Contraseña |
|-----------|-----------|-------------------|------------|
| Admin     | —         | admin@np.com      | admin123   |
| Vendedor  | Quilmes   | quilmes@np.com    | vend123    |
| Vendedor  | La Plata  | laplata@np.com    | vend123    |
| Vendedor  | Gonnet    | gonnet@np.com     | vend123    |

> Cambiá las contraseñas desde **Usuarios** antes de arrancar en producción.

---

## Flujo recomendado para arrancar a operar

1. Loguearte como **admin** y revisar / completar los 5 modelos en **Modelos**.
2. Cargar los **ingresos** iniciales por sucursal (Ingresos → Nuevo ingreso).
3. Iniciar a los vendedores con sus credenciales y dejar que registren **ventas** desde
   sus cuentas (cada uno en su sucursal).
4. Usar **Stock**, **Movimientos** y **Dashboard** para auditar.
5. Exportar reportes desde el botón **Excel/CSV/PDF** según necesidad.

---

## Scripts disponibles

| Comando                   | Descripción                                 |
|---------------------------|---------------------------------------------|
| `npm run dev`             | Servidor de desarrollo en `:3000`.          |
| `npm run build`           | Build de producción.                        |
| `npm run start`           | Ejecuta el build.                           |
| `npm run lint`            | Linter de Next.js.                          |
| `npm run prisma:generate` | Genera el cliente de Prisma.                |
| `npm run prisma:push`     | Aplica el schema a la base (dev).           |
| `npm run prisma:migrate`  | Crea y aplica una migración.                |
| `npm run prisma:seed`     | Puebla la base con usuarios y productos.    |
| `npm run prisma:studio`   | Abre Prisma Studio.                         |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (app)/                      Grupo protegido (requiere sesión)
│   │   ├── dashboard/              Dashboard con gráficos y PDF
│   │   ├── stock/                  Stock por sucursal y modelo
│   │   ├── ingresos/               Lista + nuevo ingreso (admin)
│   │   ├── ventas/                 Lista + nueva venta (todos)
│   │   ├── bajas/                  Lista + nueva baja (admin)
│   │   ├── movimientos/            Historial unificado
│   │   ├── productos/              ABM modelos (admin)
│   │   ├── usuarios/               Edición de los 4 slots (admin)
│   │   └── layout.tsx              Sidebar + auth guard
│   ├── api/auth/                   Handlers de NextAuth
│   ├── login/                      Pantalla de login
│   └── layout.tsx                  Layout raíz
├── components/
│   ├── ui/                         Primitivos (button, card, table, etc.)
│   ├── dashboard/                  Charts (recharts) + PDF (@react-pdf)
│   ├── ingresos|ventas|bajas|.../  Forms por entidad
│   ├── export-buttons.tsx          Excel + CSV
│   ├── filtros-form.tsx            Filtros GET reutilizables
│   ├── login-form.tsx              Form de login
│   ├── sidebar.tsx                 Nav lateral filtrada por rol
│   └── submit-button.tsx           Botón con estado de pending
├── lib/
│   ├── auth.config.ts              NextAuth edge-safe
│   ├── auth.ts                     NextAuth con Prisma + bcrypt
│   ├── constants.ts                Sucursales, labels, proveedor
│   ├── format.ts                   Pesos, cajas, fechas (es-AR)
│   ├── prisma.ts                   Cliente singleton
│   └── utils.ts                    cn() helper
├── schemas/                        Esquemas Zod (cliente + server)
├── server/
│   ├── actions/                    Mutaciones (server actions)
│   └── queries/                    Lecturas y agregaciones
├── types/                          Tipos compartidos (NextAuth)
└── middleware.ts                   Protección de rutas
prisma/
├── schema.prisma                   Modelos y enums
└── seed.ts                         Usuarios y productos iniciales
```

---

## Permisos por rol

| Pantalla         | Admin | Vendedor                   |
|------------------|:-----:|----------------------------|
| Dashboard        |   ✓   | ✓ (solo su sucursal)       |
| Stock            |   ✓   | ✓ (solo su sucursal)       |
| Movimientos      |   ✓   | ✓ (solo su sucursal)       |
| Ventas — listar  |   ✓   | ✓ (solo las suyas)         |
| Ventas — crear   |   ✓   | ✓                          |
| Ingresos         |   ✓   | ✗                          |
| Bajas            |   ✓   | ✗                          |
| Modelos          |   ✓   | ✗                          |
| Usuarios         |   ✓   | ✗                          |

Las restricciones se aplican en tres capas: middleware, server component (redirect)
y server action (chequeo de rol antes de mutar).

---

## Troubleshooting

**El login dice "Email o contraseña incorrectos" con las cuentas del seed.**
Verificá que corriste `npm run prisma:seed` después de crear la base.

**`Error: P1001: Can't reach database server`**
Revisá que PostgreSQL esté corriendo y que `DATABASE_URL` sea correcta. Si usás
Supabase, verificá la URL del Connection Pooler o la directa.

**`AUTH_SECRET` missing.**
Generá uno con `npx auth secret` y pegalo en `.env`.

**El PDF no descarga.**
La librería `@react-pdf/renderer` se carga solo cuando hacés click en "Exportar PDF".
Esperá unos segundos la primera vez (lazy load).

**Conflicto de peer deps al instalar.**
Probá `npm install --legacy-peer-deps`.

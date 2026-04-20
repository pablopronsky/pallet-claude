# 📊 Análisis de Bugs y Mejoras — Nuevo Parket

**Fecha:** 2026-04-19  
**Analista:** Claude (Opus 4.7)

---

## Resumen ejecutivo

Se identificaron **13 bugs** (5 críticos, 4 medios, 4 leves) y **7 mejoras** de arquitectura/UX.
El código está bien estructurado, pero **hay 3 riesgos financieros inmediatos**:

1. **Conversión USD sin tipo de cambio** → deuda/utilidad calculadas mal.
2. **FIFO no imputa bajas a lotes** → costo de venta incorrecto.
3. **Race condition en ventas concurrentes** → overselling silencioso.

Se recomienda priorizar los 3 bugs críticos + tests antes de escalar operaciones.

---

## 🔴 BUGS CRÍTICOS (Riesgo financiero / Integridad de datos)

### ✅ Bug #1: `montoEnARS()` devuelve USD como ARS cuando falta tipo de cambio *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/lib/format.ts:72-81`  
**Severidad:** 🔴 CRÍTICA  
**Impacto:** Deuda, utilidad, total facturado y saldo pendiente incorrectos.

**Descripción:**
```ts
export function montoEnARS(
  monto: Numerico | null | undefined,
  moneda: Moneda,
  tipoCambio: Numerico | null | undefined,
): number {
  const m = toNumber(monto);
  if (moneda === "ARS") return m;
  const tc = toNumber(tipoCambio);
  return tc > 0 ? m * tc : m;  // ❌ Si TC es null/0, devuelve monto USD sin convertir
}
```

Si un ingreso/venta/liquidación es USD y `tipoCambio = NULL`, suma USD como si fueran pesos.
Aunque los schemas exigen TC en alta, nada impide:
- Datos viejos sin TC (migraciones incompletas).
- Un admin editar futuro sin validar.
- Un error de migración de datos.

**Líneas afectadas:**
- `src/server/queries/dashboard.ts:139-144` — cálculo de deuda y utilidad.
- `src/server/queries/movimientos.ts:131-142, 149-164, 203-214` — totales en historial.
- Cualquier otra query que llame a `montoEnARS()`.

**Solución propuesta:**
- [ ] Opción A (estricta): Lanzar error si USD sin TC.
  ```ts
  if (moneda === "USD" && (!tipoCambio || toNumber(tipoCambio) <= 0)) {
    throw new Error(`USD sin tipo de cambio: monto ${m}`);
  }
  ```
- [ ] Opción B (robusta): Devolver `Result<number>` que el llamante maneje explícitamente.
- [ ] Agregar constraint en DB: `CHECK (moneda = 'ARS' OR "tipoCambio" IS NOT NULL)` en migración Prisma.
- [ ] En dashboard y movimientos: envolver llamadas con try/catch y mostrar alerta "Dato corrupto: venta `{id}` USD sin TC" si falla.

**Estimado:** 1-2 horas.

---

### Bug #2: FIFO de ventas no imputa bajas a ningún lote
**Archivo:** `src/server/actions/ventas.ts:107-145`  
**Severidad:** 🔴 CRÍTICA  
**Impacto:** Costo imputado a venta es incorrecto → utilidad bruta imprecisa.

**Descripción:**
El modelo `Baja` no tiene `ingresoId`. Cuando se da una baja:
- Se descuenta del total agregado de la sucursal (chequeo en línea 75-97).
- PERO el loop FIFO de ventas calcula `libres = cantidadCajas − ventas − transferencias` **sin restar bajas**.

Ejemplo:
```
Ingreso: 10 cajas a $100 c/u
Baja: 3 cajas (rotura)
Venta: 5 cajas a $150 c/u

Cálculo actual:
  - disponible = 10 - 0 - 0 - 0 = 10 ✓ (chequeo de stock pasa)
  - libres del ingreso = 10 - 0 - 0 = 10
  - venta se imputa a este ingreso: costo = 5 × $100 = $500

Realidad física:
  - Las 3 bajas son del mismo ingreso (antigüedad = mismo lote FIFO).
  - La venta debería costar 5 × $100 = $500, pero el ingreso tiene sólo 7 cajas libres (10 - 3).
  - Al próximo pago a proveedor, se discrepan 2 cajas (7 libres vs 10 que se computó).
```

**Líneas afectadas:**
- `prisma/schema.prisma:142-160` — modelo `Baja` sin `ingresoId`.
- `src/server/actions/ventas.ts:119-145` — loop FIFO no considera bajas.
- `src/server/actions/bajas.ts` — crea baja sin asignar a lote.
- `src/server/queries/stock.ts:140-172` — `getIngresosDisponiblesFIFO()` ignora bajas.

**Solución propuesta:**
- [ ] Agregar a `Baja`: `ingresoId String`, relación con `Ingreso`, y `@@index([ingresoId])`.
- [ ] Migración: backfill asignando cada baja existente al ingreso FIFO disponible en su fecha.
- [ ] Refactorizar `src/server/actions/bajas.ts` para **replicar el loop FIFO de ventas**:
  ```ts
  // Reusable: extraer a function bajaAction()
  // que itere ingresos FIFO, calcule 'libres', y cree N filas Baja si cruza lotes.
  ```
- [ ] Actualizar `src/server/actions/ventas.ts:119-127` para incluir `ing.bajas` y restar en cálculo de `libres`.
- [ ] Actualizar `src/server/queries/stock.ts:153-171` en `getIngresosDisponiblesFIFO()`.
- [ ] Tests: venta que cruza 2 ingresos con bajas distribuidas → verificar costo ponderado.

**Estimado:** 3-4 horas.

---

### Bug #3: Liquidaciones contra deuda en otra moneda — sin conciliar USD vs ARS
**Archivo:** `src/server/queries/dashboard.ts:185-189`  
**Severidad:** 🔴 CRÍTICA  
**Impacto:** Saldo pendiente con proveedor es incorrecto → reporte financiero falso.

**Descripción:**
```ts
const liquidadoTotal = liquidaciones.reduce(
  (acc, l) => acc + montoEnARS(l.monto, l.moneda, l.tipoCambio),
  0,
);
const saldoPendiente = Math.max(0, deudaTotal - liquidadoTotal);
```

Problema: **deuda USD pagada con ARS al TC del día tiene impacto distinto** que el TC original de ingreso.

Ejemplo:
```
Ingreso: 100 cajas USD a $100 USD/caja (TC = 1.000 en día 1) → deuda = 10.000 USD = $10.000 ARS
Pago: $12.000 ARS en día 30 (TC = 1.200) → equivale a 10.000 USD

Cálculo actual:
  - deudaTotal = 100 × $100 (TC=1.000) = $10.000
  - liquidadoTotal = $12.000 (TC=1.200) = $10.000 USD (correcto aritméticamente)
  - saldoPendiente = max(0, 10.000 - 12.000) = 0 ✓

Pero si TC bajó:
Pago: $9.000 ARS en día 30 (TC = 0.900) → equivale a 10.000 USD
  - liquidadoTotal = $9.000 (TC=0.900) = 10.000 USD (?)
  - saldoPendiente = max(0, 10.000 - 9.000) = $1.000 (es fantasma)
```

**Líneas afectadas:**
- `src/server/queries/dashboard.ts:129-189` — acumuladores en moneda mixta.
- `src/server/queries/dashboard.ts:44-47` — tipos `DashboardData` devuelven un `saldoPendiente` único.
- `src/app/(app)/dashboard/page.tsx` — UI que muestra saldo.

**Solución propuesta:**
Requiere decisión de producto: **¿la deuda con All Covering se lleva en USD o ARS?**

**Opción A (USD nativo — recomendado):**
- [ ] Agregar modelo `DeudaUSD` o campo en `DashboardData`:
  ```ts
  deudaUSD: number;
  liquidadoUSD: number;
  saldoPendienteUSD: number;
  deudaARS: number;
  liquidadoARS: number;
  ```
- [ ] Recalcular dashboard en dos acumuladores separados:
  ```ts
  let deudaUSD = 0, deudaARS = 0;
  for (const v of ventas) {
    const costoUSD = v.ingreso.moneda === "USD" 
      ? toNumber(v.ingreso.precioCostoPorCaja) 
      : toNumber(v.ingreso.precioCostoPorCaja) / toNumber(v.ingreso.tipoCambio || 1);
    const costoARS = montoEnARS(...);
    if (v.ingreso.moneda === "USD") deudaUSD += ...;
    else deudaARS += costoARS;
  }
  ```
- [ ] Dashboard muestra ambos: "Deuda USD", "Deuda ARS", "Saldo pendiente (USD)", "Saldo pendiente (ARS)".

**Opción B (ARS, pero trackear TC):**
- [ ] Agregar `Liquidacion.tcUsado Decimal` y recalcular saldo en función del TC promedio.

**Estimado:** 4-5 horas (requiere refinamiento de producto).

---

### ✅ Bug #4: `unstable_cache` con `revalidate: 60s` + `revalidateTag("x", "max")` — inconsistencia *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/server/queries/dashboard.ts:238-252`, `stock.ts:123-130`, `movimientos.ts:225-239`  
**Severidad:** 🔴 CRÍTICA (en UX/confiabilidad)  
**Impacto:** Admin carga una venta grande y no la ve en el dashboard por hasta 60 segundos.

**Descripción:**
```ts
export const getDashboardData = unstable_cache(
  _getDashboardData,
  ["dashboard-data"],
  {
    tags: ["dashboard", "ingresos", "ventas", "bajas", "transferencias", "liquidaciones"],
    revalidate: 60,  // TTL de 60 segundos
  },
);
```

Cuando se crea una venta en [src/server/actions/ventas.ts:164](src/server/actions/ventas.ts#L164):
```ts
revalidateTag("ventas", "max");  // ❌ "max" no es válido en Next 16
```

Next.js 16 cambió: `revalidateTag(tag)` purga el tag, o `updateTag(tag)` actualiza read-your-own-writes.
Ambas son **síncronas con el cliente**, pero el TTL de 60s hace que si el tag no se purga, los datos viejos siguen cacheados.

**Líneas afectadas:**
- `src/server/actions/ventas.ts:160-165`
- `src/server/actions/ingresos.ts:64-69`
- `src/server/actions/bajas.ts:89-94`
- `src/server/actions/transferencias.ts:145-151`
- `src/server/actions/liquidaciones.ts:51-54`

**Solución propuesta:**
- [ ] Reemplazar **todos** los `revalidateTag(x, "max")` por `updateTag(x)` (Next 16 API correcta).
- [ ] Bajar `revalidate: 60` a `revalidate: 30` o eliminar (depende de volumen de queries).
- [ ] Documentar: "updateTag purga inmediatamente; el 'max' antigua de Next 15 no aplica."

**Estimado:** 30 minutos.

---

## 🟡 BUGS MEDIOS (Lógica / UX)

### ✅ Bug #5: Formulario de venta visible a LOGISTICA, pero acción rechaza *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/app/(app)/ventas/nueva/page.tsx:19-42`  
**Severidad:** 🟡 MEDIA  
**Impacto:** UX confusa — forma accesible pero rechaza silenciosamente.

**Descripción:**
User con rol LOGISTICA (sin sucursal) ve `/ventas/nueva` y el form carga, pero al enviar:
```ts
if (!sucursal) {
  return { ok: false, error: "No se pudo determinar la sucursal de la venta." };
}
```

**Solución propuesta:**
- [ ] En `src/app/(app)/ventas/nueva/page.tsx:19`, agregar guard temprano:
  ```ts
  if (user.rol === "LOGISTICA") {
    redirect("/dashboard");
  }
  ```
- [ ] Revisar lo mismo en `/ingresos/nueva`, `/bajas/nueva`, `/transferencias/nueva` (esos sí tienen ADMIN-only explicit).

**Estimado:** 30 minutos.

---

### ✅ Bug #6: Fechas de movimientos pueden ser futuras *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/schemas/venta.ts:25`, `ingreso.ts:25`, `baja.ts`, `transferencia.ts:17`, `liquidacion.ts`  
**Severidad:** 🟡 MEDIA  
**Impacto:** Tipeos futuros distorsionan evolución mensual del dashboard.

**Descripción:**
```ts
fecha: z.coerce.date().optional(),
```

Si un admin tipea 2027 en vez de 2026, se registra y rompe la gráfica de evolución (mes futuro sin datos).

**Solución propuesta:**
- [ ] Agregar validación en todos los schemas:
  ```ts
  fecha: z.coerce
    .date()
    .optional()
    .refine((d) => !d || d <= new Date(), {
      message: "La fecha no puede ser futura",
    }),
  ```

**Estimado:** 30 minutos.

---

### Bug #7: Liquidaciones ignoran filtro de sucursal — saldo pendiente inflado para vendedores
**Archivo:** `src/server/queries/dashboard.ts:113-125`  
**Severidad:** 🟡 MEDIA  
**Impacto:** Vendedores ven deuda falsa (inflada) en su dashboard.

**Descripción:**
```ts
const liquidaciones = sucursal
  ? Promise.resolve([])  // ❌ Fuerza liquidaciones = [] si hay filtro de sucursal
  : prisma.liquidacion.findMany({...});
```

Consecuencia:
- Deuda = Σ ventas de la sucursal.
- Liquidado = 0 (porque se fuerza array vacío).
- Saldo pendiente = Deuda entera (incorrecto — pagan todos los ingresos, no por sucursal).

**Solución propuesta:**
- [ ] **Opción A (simple):** Ocultar las cards de "Liquidado" y "Saldo pendiente" cuando hay filtro de sucursal.
  ```tsx
  {!sucursal && (
    <>
      <Card>Liquidado: {formatARS(liquidadoTotal)}</Card>
      <Card>Saldo: {formatARS(saldoPendiente)}</Card>
    </>
  )}
  ```
- [ ] **Opción B (correcta):** Agregar `Liquidacion.sucursalIds String[]` o `Liquidacion.sucursal Sucursal` y prorratear.

**Estimado:** 30 minutos (A) o 2 horas (B).

---

### ✅ Bug #8: Validación de sucursal en `crearVentaAction` es un cast sin chequeo *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/server/actions/ventas.ts:24-34`  
**Severidad:** 🟡 MEDIA  
**Impacto:** Admin envía sucursal inválida → error genérico; además, producto puede estar inactivo.

**Descripción:**
```ts
const sucursalForm = String(formData.get("sucursal") ?? "");
sucursal = sucursalForm as typeof sucursal;  // ❌ Cast sin validación
```

Si alguien envía `sucursal=FAKE` por DevTools, Prisma falla con error genérico.
Además, no se verifica `producto.activo` (contraste con `crearIngresoAction:40-48` que sí lo hace).

**Solución propuesta:**
- [ ] Agregar al schema `crearVentaSchema`:
  ```ts
  sucursal: z.nativeEnum(Sucursal).optional(),  // Para admin
  ```
- [ ] En action, usar `parsed.data.sucursal` (validado).
- [ ] Agregar chequeo de producto activo antes de crear venta:
  ```ts
  const producto = await tx.producto.findUnique({
    where: { id: productoId, activo: true },
  });
  if (!producto) {
    throw new Error("Producto no está disponible.");
  }
  ```

**Estimado:** 1 hora.

---

### ✅ Bug #9: Open redirect en `callbackUrl` del login *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/server/actions/auth.ts:32-39`  
**Severidad:** 🟡 MEDIA  
**Impacto:** Redirige a sitio externo si attacker controla el form.

**Descripción:**
```ts
const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
await signIn("credentials", {
  // ...
  redirectTo: callbackUrl,  // ❌ Sin validación
});
```

NextAuth v5 suele filtrar URLs externas, pero es mejor defensa en profundidad.

**Solución propuesta:**
- [ ] Validar antes de pasar a `signIn`:
  ```ts
  const safeCallbackUrl = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/dashboard";
  ```

**Estimado:** 15 minutos.

---

### ✅ Bug #10: LOGISTICA/VENDEDOR sin validación de rol en queries de venta *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/app/(app)/ventas/page.tsx:40`  
**Severidad:** 🟡 MEDIA  
**Impacto:** Si vendedor.sucursal = null (unlikely por `@@unique`, pero posible), se devuelven todas las ventas.

**Descripción:**
```ts
const where = user.rol === "VENDEDOR" ? { sucursal: user.sucursal! } : {};
```

Si `user.sucursal = null` (no debería ocurrir, pero hay defensa en profundidad), `where = { sucursal: null }`,
que Prisma puede interpretar incorrectamente.

**Solución propuesta:**
- [ ] En `src/lib/auth.ts:32-38`, rechazar login si `rol === "VENDEDOR" && !sucursal`:
  ```ts
  if (user.rol === "VENDEDOR" && !user.sucursal) {
    throw new Error("Vendedor sin sucursal asignada — contacte al admin.");
  }
  return user;
  ```

**Estimado:** 15 minutos.

---

## 🟢 MEJORAS (Arquitectura / Contabilidad / Tests)

### Mejora #11: Deuda y utilidad deberían ser campos **persistidos** (snapshot) en cada venta
**Archivo:** `prisma/schema.prisma:116-140`, `src/server/actions/ventas.ts:130-143`  
**Tipo:** Arquitectura de datos  
**Impacto:** Inmutabilidad contable — reportes históricos no cambian si TC se corrige.

**Descripción:**
Hoy se recalculan en cada query. Problema: si cambia el TC histórico (corrección de dato), todas las utilidades del pasado cambian retroactivamente. Para auditoría contable, **es inaceptable**.

**Solución propuesta:**
- [ ] Agregar a `Venta` tres columnas `Decimal(14,2)`:
  ```prisma
  model Venta {
    // ... campos existentes ...
    
    // Snapshot al momento de la venta (inmutable)
    costoUnitarioARS      Decimal  @db.Decimal(14, 2)  // costo en ARS convertido
    precioUnitarioARS     Decimal  @db.Decimal(14, 2)  // precio venta en ARS convertido
    utilidadUnitariaARS   Decimal  @db.Decimal(14, 2)  // (precioUnitarioARS - costoUnitarioARS)
  }
  ```
- [ ] Migración: backfill recalculando para ventas existentes.
- [ ] En [src/server/actions/ventas.ts:130-143](src/server/actions/ventas.ts#L130-L143), computar y guardar al crear:
  ```ts
  const costoARS = montoEnARS(ing.precioCostoPorCaja, ing.moneda, ing.tipoCambio);
  const precioARS = montoEnARS(v.precioVentaPorCaja, v.moneda, v.tipoCambio);
  
  await tx.venta.create({
    data: {
      // ...
      costoUnitarioARS: costoARS,
      precioUnitarioARS: precioARS,
      utilidadUnitariaARS: precioARS - costoARS,
    },
  });
  ```
- [ ] Dashboard y movimientos pasan a sumar directamente `utilidadUnitariaARS * cantidadCajas` (más rápido + inmutable).
- [ ] Tests: verificar que `sum(utilidadUnitariaARS * cantidadCajas)` coincida con cálculo agregado anterior.

**Estimado:** 3-4 horas (incluye migración + tests).

---

### ✅ Mejora #12: Race condition en ventas concurrentes — puede haber overselling *(IMPLEMENTADO 2026-04-19)*
**Archivo:** `src/server/actions/ventas.ts:71-154`, `transferencias.ts:58-138`, `bajas.ts:41-83`  
**Tipo:** Concurrencia / data integrity  
**Impacto:** Dos ventas simultáneas pueden ambas pasar stock check pero consumir más de lo disponible.

**Descripción:**
En default isolation level (`READ COMMITTED` en Postgres):
1. Venta A: `SELECT SUM(cantidadCajas) ... WHERE producto=X, sucursal=Y` → ve 10.
2. Venta B: `SELECT SUM(cantidadCajas) ... WHERE producto=X, sucursal=Y` → ve 10.
3. Venta A: crea venta de 8 cajas ✓.
4. Venta B: crea venta de 8 cajas ✓.
5. Stock real consumido: 16 > 10 → **overselling**.

Prisma `$transaction()` usa `READ COMMITTED` por defecto (no es `SERIALIZABLE`).

**Solución propuesta:**

**Opción A (Simple — usando Serializable):**
- [ ] Pasar nivel de aislamiento a transacción:
  ```ts
  await prisma.$transaction(
    async (tx) => { /* ... */ },
    { isolationLevel: "Serializable" },
  );
  ```
- [ ] Envolver con retry + backoff:
  ```ts
  let retries = 3;
  while (retries--) {
    try {
      await prisma.$transaction(..., { isolationLevel: "Serializable" });
      break;
    } catch (err) {
      if (retries && err.code === "P2034") {
        await sleep(50);
      } else throw err;
    }
  }
  ```

**Opción B (Más performante — row lock):**
- [ ] Usar `tx.$queryRaw` con `SELECT ... FOR UPDATE`:
  ```ts
  await tx.$queryRaw`
    SELECT id FROM "Ingreso" 
    WHERE "productoId" = ${productoId} 
      AND sucursal = ${sucursal} 
    ORDER BY fecha ASC 
    FOR UPDATE;
  `;
  ```
- [ ] Luego el loop FIFO ya tiene rows bloqueados.

**Estimado:** 2 horas (A) o 3 horas (B + tests de concurrencia).

---

### Mejora #13: Tests para FIFO y cálculos financieros
**Archivo:** `(crear) __tests__/server/actions/ventas.test.ts`, etc.  
**Tipo:** QA / Regression prevention  
**Impacto:** Protege los bugs #2, #12, #14 ante futuros cambios.

**Descripción:**
No hay suite de tests. Este código calcula plata → es donde más se necesitan.

**Solución propuesta:**
- [ ] Agregar `vitest` + `@prisma/client` (DB de test en Docker o SQLite en memoria).
- [ ] Casos mínimos:
  ```
  ✓ Venta FIFO cruza 2 ingresos con costos distintos → costo promedio ponderado OK.
  ✓ Venta que agota stock exactamente → sin overselling.
  ✓ Venta que excede stock → rollback, error claro.
  ✓ Dos ventas concurrentes sobre el mismo producto → sólo 1 pasa si stock = N y ambas piden N.
  ✓ Venta USD sin TC → falla explícita (ver Bug #1).
  ✓ Baja FIFO imputa a lote correcto (ver Mejora #11).
  ✓ Deuda USD con liquidación ARS → cálculo correcto (ver Bug #3).
  ```
- [ ] Estructura: `tests/server/__fixtures__/seed.ts` (crea 3 sucursales, 5 productos, ingresos).
- [ ] Referencia: [Prisma testing docs](https://www.prisma.io/docs/orm/reference/prisma-client-reference#test-databases).

**Estimado:** 4-5 horas (setup + 6-8 test cases).

---

### Mejora #14: Idempotencia de forms (PRG + Idempotency Key)
**Archivo:** `prisma/schema.prisma:116-140, 88-114, etc.`, `src/server/actions/ventas.ts:11-166`, etc.  
**Tipo:** UX / Data integrity  
**Impacto:** Si vendedor dobla-clickea "Registrar", no se crea duplicado.

**Descripción:**
Sin `idempotencyKey`, si el form se envía dos veces (doble click o network retry), se crean dos ventas idénticas.

**Solución propuesta:**
- [ ] Agregar a cada modelo transaccional:
  ```prisma
  model Venta {
    // ...
    idempotencyKey String? @unique  // UUID generado por cliente
  }
  ```
- [ ] En el form (client-side), generar UUID antes de submit (o usar hidden field).
- [ ] En action, verificar antes de crear:
  ```ts
  const existing = await tx.venta.findUnique({ where: { idempotencyKey } });
  if (existing) return { ok: true, mensaje: "Venta ya registrada (reintento detectado)." };
  ```

**Estimado:** 2 horas (schema + client generation + server check).

---

### Mejora #15: Auditoría (logging de cambios)
**Archivo:** `prisma/schema.prisma` (nuevo modelo), `src/lib/audit.ts` (nuevo)  
**Tipo:** Compliance / Multi-user safety  
**Impacto:** Responder "quién editó qué y cuándo" (crítico si hay dispute).

**Descripción:**
Con 3+ usuarios, es imposible auditar si no se registran cambios. Imprescindible para compliance contable.

**Solución propuesta:**
- [ ] Modelo `AuditLog`:
  ```prisma
  model AuditLog {
    id        String   @id @default(cuid())
    entidad   String   // "Venta", "Ingreso", "Liquidacion", etc.
    entidadId String
    accion    String   // "CREATE", "UPDATE", "DELETE"
    adminId   String
    antes     Json?    // Snapshot anterior (para UPDATE)
    despues   Json?    // Snapshot nuevo
    fecha     DateTime @default(now())
    
    admin User @relation(fields: [adminId], references: [id])
    
    @@index([entidad, entidadId])
    @@index([adminId])
    @@index([fecha])
  }
  ```
- [ ] Helper `src/lib/audit.ts`:
  ```ts
  export async function logAudit(
    entidad: string,
    entidadId: string,
    accion: "CREATE" | "UPDATE" | "DELETE",
    adminId: string,
    antes?: any,
    despues?: any,
  ) {
    await prisma.auditLog.create({
      data: { entidad, entidadId, accion, adminId, antes, despues, fecha: new Date() },
    });
  }
  ```
- [ ] En cada action, invocar antes de crear/actualizar.
- [ ] UI: página `/auditoria` que muestre log filtrable por entidad, user, fecha.

**Estimado:** 5-6 horas (schema + UI + tests).

---

### Mejora #16: Verificar lazy-load del PDF renderer
**Archivo:** `src/components/dashboard/` (o donde se use `@react-pdf/renderer`)  
**Tipo:** Performance  
**Impacto:** Si se carga eagerly, el bundle suma ~500KB al TTFB del dashboard.

**Descripción:**
`@react-pdf/renderer` es pesado. Si se importa directamente, afecta TTFB. Should be lazy-loaded.

**Solución propuesta:**
- [ ] Verificar que se use `dynamic(() => import(...), { ssr: false })`:
  ```ts
  const PDFExporter = dynamic(() => import("@/components/pdf-exporter"), {
    ssr: false,
    loading: () => <Spinner />,
  });
  ```
- [ ] Si no, refactorizar.
- [ ] Tests: medir TTFB con y sin lazy-load.

**Estimado:** 30 minutos.

---

### Mejora #17: Manejo de errores más granular en server actions
**Archivo:** `src/server/actions/` (todos)  
**Tipo:** UX / Security  
**Impacto:** No exponer errores internos de BD; mensajes claros al usuario.

**Descripción:**
Hoy se devuelven `err.message` directamente. Si Prisma tira `P2002 Unique constraint failed`, el usuario lo ve.

**Solución propuesta:**
- [ ] Categorizar errores:
  ```ts
  if (err instanceof Error) {
    if (err.message.includes("P2002")) {
      return { ok: false, error: "Ese registro ya existe." };
    }
    if (err.message.includes("P2025")) {
      return { ok: false, error: "Registro no encontrado." };
    }
    // Errores "de negocio" (stock insuficiente, etc.) → devolver como están
    if (err.message.includes("Stock insuficiente")) {
      return { ok: false, error: err.message };
    }
    // Otros → log + genérico
    console.error(`[${action}] Error no manejado:`, err);
    return { ok: false, error: "Error al procesar. Contacta al admin." };
  }
  ```

**Estimado:** 2 horas.

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Bugs críticos (Semana 1)
1. **Bug #1** (USD sin TC): 1h. Riesgo contable inmediato.
2. **Bug #4** (revalidateTag fix): 30 min. Rápido, impacto en UX.
3. **Bug #12** (race condition): 2-3h. Protege integridad de datos.

**Total:** ~4h. Impacto: evita silent data corruption y cálculos mal hechos.

### Fase 2: Bugs medios + mejora crítica (Semana 2)
4. **Bug #2** (FIFO ignora bajas): 3-4h. Junto con tests.
5. **Mejora #11** (snapshot de costos): 3-4h. Inmutabilidad contable.
6. **Mejora #13** (tests FIFO): 4-5h. Protege los fixes anteriores.

**Total:** ~11h. Impacto: precisión contable, regression protection.

### Fase 3: Bugs medios y mejoras de UX (Semana 3)
7. **Bug #3** (conciliación USD/ARS): 4-5h. Requiere decisión de producto.
8. **Bug #5, #6, #8, #9, #10**: 2h combinadas. Validaciones y guards.
9. **Mejora #14** (idempotencia): 2h.

**Total:** ~8h. Impacto: UX mejorada, consistencia de datos.

### Fase 4: Auditoría y operación (Semana 4+)
10. **Mejora #15** (auditoría): 5-6h. Crítico si crece en usuarios.
11. **Mejora #16** (perf PDF): 30 min.
12. **Mejora #17** (manejo errores): 2h.

**Total:** ~8.5h. Impacto: compliance, observabilidad.

---

## ✅ Checklist de validación

Una vez implementados, verificar:

- [ ] Todos los cálculos de deuda/utilidad dan mismo resultado antes/después.
- [ ] Ventas concurrentes no generan overselling (test con `Promise.all`).
- [ ] Liquidaciones en USD concilian con deuda USD original.
- [ ] Dashboard muestra saldo pendiente 0 si se liquidó 100%.
- [ ] Bajas se imputan a lotes correctos (verificar costo de venta = costo del lote).
- [ ] Revalidación de cache es inmediata (sin esperar 60s).
- [ ] Audit log registra todos los cambios de deuda/utilidad.
- [ ] Tests pasan al 100%.

---

## 🔗 Referencias y links

- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [NextAuth v5 docs](https://authjs.dev/)
- [Next.js 16 cache](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Vitest setup with Prisma](https://www.prisma.io/docs/orm/reference/prisma-client-reference#test-databases)

---

**Última actualización:** 2026-04-19  
**Estado:** En revisión y planificación

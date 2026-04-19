-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "Sucursal" AS ENUM ('QUILMES', 'LA_PLATA', 'GONNET');

-- CreateEnum
CREATE TYPE "Motivo" AS ENUM ('MUESTRA', 'ROTURA', 'DONACION', 'VENCIMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "OrigenIngreso" AS ENUM ('PROVEEDOR', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "sucursal" "Sucursal",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "sucursal" "Sucursal" NOT NULL,
    "cantidadCajas" INTEGER NOT NULL,
    "precioCostoPorCaja" DECIMAL(14,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
    "tipoCambio" DECIMAL(12,4),
    "origen" "OrigenIngreso" NOT NULL DEFAULT 'PROVEEDOR',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "ingresoId" TEXT NOT NULL,
    "sucursal" "Sucursal" NOT NULL,
    "cantidadCajas" INTEGER NOT NULL,
    "precioVentaPorCaja" DECIMAL(14,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
    "tipoCambio" DECIMAL(12,4),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Baja" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "sucursal" "Sucursal" NOT NULL,
    "cantidadCajas" INTEGER NOT NULL,
    "motivo" "Motivo" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "sucursalOrigen" "Sucursal" NOT NULL,
    "sucursalDestino" "Sucursal" NOT NULL,
    "cantidadCajas" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "notas" TEXT,
    "ingresoOrigenId" TEXT NOT NULL,
    "ingresoDestinoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidacion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(14,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
    "tipoCambio" DECIMAL(12,4),
    "comprobante" TEXT,
    "notas" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_rol_sucursal_key" ON "User"("rol", "sucursal");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_nombre_key" ON "Producto"("nombre");

-- CreateIndex
CREATE INDEX "Producto_activo_idx" ON "Producto"("activo");

-- CreateIndex
CREATE INDEX "Ingreso_productoId_idx" ON "Ingreso"("productoId");

-- CreateIndex
CREATE INDEX "Ingreso_sucursal_idx" ON "Ingreso"("sucursal");

-- CreateIndex
CREATE INDEX "Ingreso_fecha_idx" ON "Ingreso"("fecha");

-- CreateIndex
CREATE INDEX "Ingreso_origen_idx" ON "Ingreso"("origen");

-- CreateIndex
CREATE INDEX "Venta_productoId_idx" ON "Venta"("productoId");

-- CreateIndex
CREATE INDEX "Venta_ingresoId_idx" ON "Venta"("ingresoId");

-- CreateIndex
CREATE INDEX "Venta_sucursal_idx" ON "Venta"("sucursal");

-- CreateIndex
CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");

-- CreateIndex
CREATE INDEX "Venta_userId_idx" ON "Venta"("userId");

-- CreateIndex
CREATE INDEX "Baja_productoId_idx" ON "Baja"("productoId");

-- CreateIndex
CREATE INDEX "Baja_sucursal_idx" ON "Baja"("sucursal");

-- CreateIndex
CREATE INDEX "Baja_fecha_idx" ON "Baja"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Transferencia_ingresoDestinoId_key" ON "Transferencia"("ingresoDestinoId");

-- CreateIndex
CREATE INDEX "Transferencia_productoId_idx" ON "Transferencia"("productoId");

-- CreateIndex
CREATE INDEX "Transferencia_sucursalOrigen_idx" ON "Transferencia"("sucursalOrigen");

-- CreateIndex
CREATE INDEX "Transferencia_sucursalDestino_idx" ON "Transferencia"("sucursalDestino");

-- CreateIndex
CREATE INDEX "Transferencia_fecha_idx" ON "Transferencia"("fecha");

-- CreateIndex
CREATE INDEX "Liquidacion_fecha_idx" ON "Liquidacion"("fecha");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "Ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baja" ADD CONSTRAINT "Baja_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baja" ADD CONSTRAINT "Baja_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_ingresoOrigenId_fkey" FOREIGN KEY ("ingresoOrigenId") REFERENCES "Ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_ingresoDestinoId_fkey" FOREIGN KEY ("ingresoDestinoId") REFERENCES "Ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

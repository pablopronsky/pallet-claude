import { Sucursal, Rol, Motivo, Moneda } from "@prisma/client";

// Listado de sucursales fijas (no configurables).
export const SUCURSALES: Sucursal[] = [
  Sucursal.QUILMES,
  Sucursal.LA_PLATA,
  Sucursal.GONNET,
];

// Etiquetas legibles para la UI.
export const SUCURSAL_LABEL: Record<Sucursal, string> = {
  QUILMES: "Quilmes",
  LA_PLATA: "La Plata",
  GONNET: "Gonnet",
};

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  LOGISTICA: "Logística",
};

export const MOTIVO_LABEL: Record<Motivo, string> = {
  MUESTRA: "Muestra",
  ROTURA: "Rotura",
  DONACION: "Donación",
  VENCIMIENTO: "Vencimiento",
  OTRO: "Otro",
};

export const MONEDAS: Moneda[] = [Moneda.ARS, Moneda.USD];

export const MONEDA_LABEL: Record<Moneda, string> = {
  ARS: "Pesos (ARS)",
  USD: "Dólares (USD)",
};

export const MONEDA_SIGNO: Record<Moneda, string> = {
  ARS: "$",
  USD: "US$",
};

// Proveedor único de la consignación.
export const PROVEEDOR_NOMBRE = "All Covering SRL";

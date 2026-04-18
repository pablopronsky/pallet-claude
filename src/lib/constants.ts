import { Sucursal, Rol, Motivo } from "@prisma/client";

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
};

export const MOTIVO_LABEL: Record<Motivo, string> = {
  MUESTRA: "Muestra",
  ROTURA: "Rotura",
  DONACION: "Donación",
  VENCIMIENTO: "Vencimiento",
  OTRO: "Otro",
};

// Proveedor único de la consignación.
export const PROVEEDOR_NOMBRE = "All Covering SRL";

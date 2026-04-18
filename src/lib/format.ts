// Helpers de formato para UI (pesos argentinos, fechas, números).

import { Prisma } from "@prisma/client";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const DEC = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export type Numerico = number | string | Prisma.Decimal | bigint;

export function toNumber(v: Numerico | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v);
  return Number(v.toString());
}

export function formatARS(v: Numerico | null | undefined): string {
  return ARS.format(toNumber(v));
}

export function formatCajas(v: Numerico | null | undefined): string {
  return NUM.format(toNumber(v));
}

export function formatDecimal(v: Numerico | null | undefined): string {
  return DEC.format(toNumber(v));
}

export function formatFecha(v: Date | string): string {
  return FECHA.format(typeof v === "string" ? new Date(v) : v);
}

export function formatFechaHora(v: Date | string): string {
  return FECHA_HORA.format(typeof v === "string" ? new Date(v) : v);
}

export function fechaParaInput(v: Date): string {
  return v.toISOString().slice(0, 10);
}

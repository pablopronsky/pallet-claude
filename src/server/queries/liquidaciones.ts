import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { montoEnARS } from "@/lib/format";

async function _getTotalLiquidadoARS(rango?: {
  desde?: Date;
  hasta?: Date;
}): Promise<number> {
  const where =
    rango?.desde || rango?.hasta
      ? {
          fecha: {
            ...(rango?.desde ? { gte: rango.desde } : {}),
            ...(rango?.hasta ? { lte: rango.hasta } : {}),
          },
        }
      : {};

  const liqs = await prisma.liquidacion.findMany({
    where,
    select: { monto: true, moneda: true, tipoCambio: true },
  });

  return liqs.reduce(
    (acc, l) => acc + montoEnARS(l.monto, l.moneda, l.tipoCambio),
    0,
  );
}

export const getTotalLiquidadoARS = unstable_cache(
  _getTotalLiquidadoARS,
  ["liquidaciones-total"],
  { tags: ["liquidaciones"], revalidate: 60 },
);

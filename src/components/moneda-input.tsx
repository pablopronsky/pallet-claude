"use client";

import { useState } from "react";
import { Moneda } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MONEDAS, MONEDA_LABEL } from "@/lib/constants";

type Props = {
  // Etiqueta del precio (ej: "Precio de costo por caja", "Precio de venta por caja", "Monto").
  precioLabel: string;
  // Nombres de los inputs en el form (defaults: "precio", "moneda", "tipoCambio").
  precioName?: string;
  monedaName?: string;
  tipoCambioName?: string;
  // Valores iniciales.
  defaultPrecio?: number | string;
  defaultMoneda?: Moneda;
  defaultTipoCambio?: number | string;
  // Errores por campo (opcionales).
  precioError?: string;
  tipoCambioError?: string;
  // step del precio (default 0.01).
  precioStep?: string;
};

export function MonedaInput({
  precioLabel,
  precioName = "precio",
  monedaName = "moneda",
  tipoCambioName = "tipoCambio",
  defaultPrecio,
  defaultMoneda = Moneda.ARS,
  defaultTipoCambio,
  precioError,
  tipoCambioError,
  precioStep = "0.01",
}: Props) {
  const [moneda, setMoneda] = useState<Moneda>(defaultMoneda);
  const esUSD = moneda === Moneda.USD;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={precioName}>
          {precioLabel} ({moneda})
        </Label>
        <Input
          id={precioName}
          name={precioName}
          type="number"
          min="0.01"
          step={precioStep}
          defaultValue={defaultPrecio}
          required
        />
        {precioError && (
          <p className="text-xs text-destructive">{precioError}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={monedaName}>Moneda</Label>
        <Select
          id={monedaName}
          name={monedaName}
          value={moneda}
          onChange={(e) => setMoneda(e.target.value as Moneda)}
        >
          {MONEDAS.map((m) => (
            <option key={m} value={m}>
              {MONEDA_LABEL[m]}
            </option>
          ))}
        </Select>
      </div>

      <div className={"space-y-1.5 " + (esUSD ? "" : "hidden")}>
        <Label htmlFor={tipoCambioName}>Tipo de cambio (ARS por USD)</Label>
        <Input
          id={tipoCambioName}
          name={tipoCambioName}
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={defaultTipoCambio}
          required={esUSD}
          placeholder="Ej: 1050"
        />
        {tipoCambioError && (
          <p className="text-xs text-destructive">{tipoCambioError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Cotización al momento de la operación.
        </p>
      </div>
    </>
  );
}

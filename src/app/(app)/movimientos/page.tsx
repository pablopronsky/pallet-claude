import { redirect } from "next/navigation";

export default function MovimientosPage() {
  // La ruta se renombró a /historial. Mantenemos este redirect para
  // cualquier link o bookmark viejo.
  redirect("/historial");
}

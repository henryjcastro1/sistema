import { Servicio } from "@/app/servicios/types";
import { useState } from "react";

interface Props {
  servicio: Servicio | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (costo: number, comentario: string) => void;
}

export default function CompletarServicioModal({
  servicio,
  open,
  onClose,
  onConfirm
}: Props) {

  const [costo, setCosto] = useState(servicio?.presupuesto || 0);
  const [comentario, setComentario] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Completar servicio
        </h2>

        <p className="text-sm text-gray-500">
          Ingresa el costo final del servicio
        </p>

        <div className="space-y-3">

          <input
            type="number"
            value={costo}
            onChange={(e) => setCosto(parseFloat(e.target.value))}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Costo final"
          />

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentarios del trabajo (opcional)"
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

        </div>

        <div className="flex justify-end gap-2 pt-4">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            onClick={() => onConfirm(costo, comentario)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Completar servicio
          </button>

        </div>

      </div>
    </div>
  );
}
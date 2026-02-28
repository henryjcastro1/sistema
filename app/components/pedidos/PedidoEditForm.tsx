"use client";

import { PedidoEditFormProps } from "./types";

export default function PedidoEditForm({ isOpen, onClose, pedido }: PedidoEditFormProps) {
  if (!isOpen || !pedido) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold">Editar Pedido #{pedido.numero_pedido} (Próximamente)</h2>
        <button onClick={onClose} className="mt-4 bg-gray-200 p-2 rounded">Cerrar</button>
      </div>
    </div>
  );
}
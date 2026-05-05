"use client";

import { PagoDetalleProps } from "./types";
import { motion } from "framer-motion";

export default function PagoDetalle({ isOpen, onClose, transaccion }: PagoDetalleProps) {
  if (!isOpen || !transaccion) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-CO");
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "COMPLETADO": return "bg-green-100 text-green-700";
      case "PENDIENTE": return "bg-yellow-100 text-yellow-700";
      case "PROCESANDO": return "bg-blue-100 text-blue-700";
      case "FALLIDO": return "bg-red-100 text-red-700";
      case "REEMBOLSADO": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Detalle de Transacción</h2>
            <p className="text-sm text-gray-500">Información completa del pago</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Estado</span>
            <span className={`px-4 py-1 rounded-full text-sm font-medium ${getEstadoColor(transaccion.estado)}`}>
              {transaccion.estado}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Pedido */}
            <div className="p-4 rounded-xl border bg-gray-50">
              <h3 className="font-semibold mb-3">Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Número</span>
                  <span className="font-mono">{transaccion.numero_pedido || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold">{formatCurrency(transaccion.pedido_total || transaccion.monto)}</span>
                </div>
              </div>
            </div>

            {/* Pago */}
            <div className="p-4 rounded-xl border bg-gray-50">
              <h3 className="font-semibold mb-3">Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto</span>
                  <span className="font-bold text-green-600">{formatCurrency(transaccion.monto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método</span>
                  <span>{transaccion.metodo_pago_tipo || "N/A"}</span>
                </div>
                {transaccion.ultimos_digitos && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tarjeta</span>
                    <span className="font-mono">**** {transaccion.ultimos_digitos}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verificación */}
          {(transaccion.estado === "COMPLETADO" || transaccion.estado === "RECHAZADO") && (
            <div className="p-4 rounded-xl border">
              <h3 className="font-semibold mb-3">Verificación</h3>
              <div className="space-y-2 text-sm">
                {transaccion.fecha_verificacion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span>{formatDate(transaccion.fecha_verificacion)}</span>
                  </div>
                )}
                {transaccion.verificador_nombre && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Por</span>
                    <span>{transaccion.verificador_nombre}</span>
                  </div>
                )}
                {transaccion.notas_admin && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-500">Notas</p>
                    <p>{transaccion.notas_admin}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comprobante */}
          {transaccion.comprobante_url && (
            <div className="flex justify-center">
              <a
                href={transaccion.comprobante_url}
                target="_blank"
                className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
              >
                Ver comprobante
              </a>
            </div>
          )}

          {/* Fechas */}
          <div className="p-4 rounded-xl border bg-gray-50">
            <h3 className="font-semibold mb-3">Fechas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creación</span>
                <span>{formatDate(transaccion.created_at)}</span>
              </div>
              {transaccion.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Actualización</span>
                  <span>{formatDate(transaccion.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

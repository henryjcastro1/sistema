"use client";

import { PagoDetalleProps } from "./types";

export default function PagoDetalle({ isOpen, onClose, transaccion }: PagoDetalleProps) {
  if (!isOpen || !transaccion) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESANDO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FALLIDO': return 'bg-red-100 text-red-800 border-red-200';
      case 'REEMBOLSADO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELADO': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Detalle de Transacción</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estado</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(transaccion.estado)}`}>
              {transaccion.estado}
            </span>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Información del Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de pedido</span>
                <span className="font-mono font-medium">{transaccion.numero_pedido || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total del pedido</span>
                <span className="font-medium">{formatCurrency(transaccion.pedido_total || transaccion.monto)}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Detalles del Pago</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto</span>
                <span className="font-bold text-green-600">{formatCurrency(transaccion.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método de pago</span>
                <span>{transaccion.metodo_pago_tipo || 'No especificado'}</span>
              </div>
              {transaccion.ultimos_digitos && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarjeta</span>
                  <span className="font-mono">**** {transaccion.ultimos_digitos}</span>
                </div>
              )}
              {transaccion.referencia_externa && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Referencia externa</span>
                  <span className="font-mono text-sm">{transaccion.referencia_externa}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Fechas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de creación</span>
                <span>{formatDate(transaccion.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
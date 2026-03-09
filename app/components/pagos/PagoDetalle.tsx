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
      case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
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
          {/* Estado */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estado</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(transaccion.estado)}`}>
              {transaccion.estado}
            </span>
          </div>

          {/* Información del Pedido */}
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

          {/* Detalles del Pago */}
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
              {transaccion.tipo_pago && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de pago</span>
                  <span>{transaccion.tipo_pago}</span>
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

          {/* 👇 NUEVA SECCIÓN: Información de Verificación */}
          {transaccion.estado === 'COMPLETADO' || transaccion.estado === 'RECHAZADO' ? (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Verificación</h3>
              <div className="space-y-2">
                {transaccion.fecha_verificacion && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de verificación</span>
                    <span>{formatDate(transaccion.fecha_verificacion)}</span>
                  </div>
                )}
                {transaccion.verificador_nombre && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verificado por</span>
                    <span>{transaccion.verificador_nombre}</span>
                  </div>
                )}
                {transaccion.notas_admin && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 block mb-1">Notas del administrador:</span>
                    <p className="text-gray-800">{transaccion.notas_admin}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Comprobante (si existe) */}
          {transaccion.comprobante_url && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Comprobante</h3>
              <div className="flex justify-center">
                <a
                  href={transaccion.comprobante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver comprobante
                </a>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Fechas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de creación</span>
                <span>{formatDate(transaccion.created_at)}</span>
              </div>
              {transaccion.updated_at && transaccion.updated_at !== transaccion.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización</span>
                  <span>{formatDate(transaccion.updated_at)}</span>
                </div>
              )}
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
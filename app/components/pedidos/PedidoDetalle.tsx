"use client";

import { useState } from "react";
import { PedidoDetalleProps } from "./types";

export default function PedidoDetalle({ isOpen, onClose, pedido }: PedidoDetalleProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'pago' | 'envio'>('items');

  if (!isOpen || !pedido) return null;

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
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAGADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENVIADO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ENTREGADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '⏳';
      case 'PAGADO': return '💰';
      case 'ENVIADO': return '📦';
      case 'ENTREGADO': return '✅';
      case 'CANCELADO': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Pedido {pedido.numero_pedido}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center gap-1 ${getEstadoColor(pedido.estado)}`}>
                {getEstadoIcon(pedido.estado)} {pedido.estado}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Creado el {formatDate(pedido.created_at)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'items' 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 Productos
            </button>
            <button
              onClick={() => setActiveTab('pago')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'pago' 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Pago
            </button>
            <button
              onClick={() => setActiveTab('envio')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'envio' 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🚚 Envío
            </button>
          </div>
        </div>

        {/* Contenido según tab */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Lista de productos */}
              <div className="space-y-3">
                {pedido.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    {/* Imagen del producto */}
                    <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center">
                      {item.producto?.imagen_url ? (
                        <img src={item.producto.imagen_url} alt={item.descripcion} className="w-14 h-14 object-cover rounded" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    
                    {/* Detalles */}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.descripcion}</h4>
                      <p className="text-sm text-gray-500">
                        {item.cantidad} x {formatCurrency(item.precio_unitario)}
                      </p>
                      {item.producto?.sku && (
                        <p className="text-xs text-gray-400">SKU: {item.producto.sku}</p>
                      )}
                    </div>
                    
                    {/* Subtotal */}
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</div>
                      <div className="text-xs text-gray-500">subtotal</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de items */}
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Total items:</span>
                  <span className="font-bold text-blue-800">{pedido.items?.length || 0}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pago' && (
            <div className="space-y-4">
              {/* Resumen financiero */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Resumen de pago</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(pedido.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Impuesto</span>
                    <span className="font-medium">{formatCurrency(pedido.impuesto)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Descuento</span>
                    <span className="font-medium text-red-600">-{formatCurrency(pedido.descuento)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Costo de envío</span>
                    <span className="font-medium">{formatCurrency(pedido.costo_envio)}</span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-green-600">{formatCurrency(pedido.total_final)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje informativo sobre pagos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💳 Módulo de pagos próximamente</p>
                <p>El sistema de pagos estará disponible en una próxima actualización. Por ahora, los pedidos se crean en estado PENDIENTE.</p>
              </div>
            </div>
          )}

          {activeTab === 'envio' && (
            <div className="space-y-4">
              {/* Información del cliente */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Cliente</h3>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">{pedido.cliente_nombre}</p>
                  <p className="text-gray-600">{pedido.cliente_email}</p>
                </div>
              </div>

              {/* Dirección de envío */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Dirección de envío</h3>
                {pedido.cliente_direccion ? (
                  <p className="text-gray-700 whitespace-pre-line">{pedido.cliente_direccion}</p>
                ) : (
                  <p className="text-gray-400 italic">No se especificó dirección de envío</p>
                )}
              </div>

              {/* Timeline del pedido */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Línea de tiempo</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pedido creado</p>
                      <p className="text-xs text-gray-500">{formatDate(pedido.created_at)}</p>
                    </div>
                  </div>
                  {pedido.updated_at !== pedido.created_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Última actualización</p>
                        <p className="text-xs text-gray-500">{formatDate(pedido.updated_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cerrar
          </button>
          {pedido.estado === 'PENDIENTE' && (
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium opacity-50 cursor-not-allowed"
              disabled
              title="Módulo de pagos próximamente"
            >
              Procesar pago (próximamente)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
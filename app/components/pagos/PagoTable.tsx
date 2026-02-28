"use client";

import { useState, useMemo } from "react";
import { PagoTableProps, Transaccion } from "./types";
import { ToastContainer, useToast } from "../usuarios/Toast";

export default function PagoTable({ 
  transacciones, 
  loading, 
  onRefresh, 
  onView 
}: PagoTableProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterTipoPago, setFilterTipoPago] = useState<string>("TODOS");

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'COMPLETADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PROCESANDO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FALLIDO': return 'bg-red-100 text-red-700 border-red-200';
      case 'REEMBOLSADO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RECHAZADO': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string): string => {
    switch (estado) {
      case 'COMPLETADO': return '✅';
      case 'PENDIENTE': return '⏳';
      case 'PROCESANDO': return '🔄';
      case 'FALLIDO': return '❌';
      case 'REEMBOLSADO': return '💰';
      case 'RECHAZADO': return '❌';
      default: return '📋';
    }
  };

  const getTipoPagoIcon = (tipo: string | null | undefined): string => {
    if (tipo === 'TARJETA') return '💳';
    if (tipo === 'TRANSFERENCIA') return '🏦';
    if (tipo === 'EFECTIVO') return '💵';
    return '💰';
  };

  const filteredTransacciones = useMemo((): Transaccion[] => {
    return transacciones.filter(t => {
      const matchesSearch = searchTerm === "" || 
        (t.numero_pedido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.referencia_externa?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.usuario_nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === "TODOS" || t.estado === filterEstado;
      const matchesTipoPago = filterTipoPago === "TODOS" || t.tipo_pago === filterTipoPago;

      return matchesSearch && matchesEstado && matchesTipoPago;
    });
  }, [transacciones, searchTerm, filterEstado, filterTipoPago]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  async function verificarPago(transaccionId: string, estado: 'COMPLETADO' | 'RECHAZADO'): Promise<void> {
    let motivo = '';
    
    if (estado === 'RECHAZADO') {
      motivo = window.prompt('Motivo del rechazo:') || '';
      if (!motivo) return; // Usuario canceló
    }

    setAccionLoading(transaccionId);
    try {
      const res = await fetch(`/api/pagos/${transaccionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado, 
          motivo_rechazo: motivo 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      showToast(
        estado === 'COMPLETADO' ? '✅ Pago aprobado correctamente' : '❌ Pago rechazado',
        'success'
      );
      onRefresh();
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al verificar pago',
        'error'
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por pedido, referencia o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            <div className="md:w-40">
              <select
                value={filterTipoPago}
                onChange={(e) => setFilterTipoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">💰 Todos los métodos</option>
                <option value="TARJETA">💳 Tarjeta</option>
                <option value="TRANSFERENCIA">🏦 Transferencia</option>
                <option value="EFECTIVO">💵 Efectivo</option>
              </select>
            </div>

            <div className="md:w-40">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📋 Todos los estados</option>
                <option value="PENDIENTE">⏳ Pendiente</option>
                <option value="PROCESANDO">🔄 Procesando</option>
                <option value="COMPLETADO">✅ Completado</option>
                <option value="RECHAZADO">❌ Rechazado</option>
              </select>
            </div>

            <div className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">{filteredTransacciones.length}</span>
              <span className="text-gray-500 ml-1">transacciones</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando transacciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Pedido</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Monto</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Método</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Comprobante</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacciones.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No hay transacciones registradas
                    </td>
                  </tr>
                ) : (
                  filteredTransacciones.map((t, index) => (
                    <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                      <td className="p-4">
                        <span className="font-mono font-medium text-gray-900">{t.numero_pedido || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{t.usuario_nombre || 'N/A'}</div>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{formatCurrency(t.monto)}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getTipoPagoIcon(t.tipo_pago)} {t.tipo_pago || 'N/A'}
                          {t.ultimos_digitos && ` ****${t.ultimos_digitos}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getEstadoColor(t.estado)}`}>
                          <span>{getEstadoIcon(t.estado)}</span>
                          {t.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.comprobante_url ? (
                          <a
                            href={t.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(t.created_at)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onView?.(t)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {t.estado === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => verificarPago(t.id, 'COMPLETADO')}
                                disabled={accionLoading === t.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                title="Aprobar pago"
                              >
                                {accionLoading === t.id ? (
                                  <span className="animate-spin border-2 border-green-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => verificarPago(t.id, 'RECHAZADO')}
                                disabled={accionLoading === t.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Rechazar pago"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
"use client";

import { useState } from "react";

interface AuditLog {
  id: string;
  created_at: string;
  usuario_email: string | null;
  usuario_nombre: string | null;
  accion: string;
  tabla: string;
  registro_id: string | null;
  datos_antes: any;
  datos_despues: any;
  ip: string;
  user_agent: string;
}

interface AuditTableProps {
  logs: AuditLog[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function AuditTableProductos({ 
  logs, 
  loading, 
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onRefresh
}: AuditTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'CREAR': return 'bg-green-100 text-green-700 border-green-200';
      case 'ACTUALIZAR': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ACTIVAR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DESACTIVAR': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ELIMINAR': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'CREAR': return '➕';
      case 'ACTUALIZAR': return '✏️';
      case 'ACTIVAR': return '✅';
      case 'DESACTIVAR': return '❌';
      case 'ELIMINAR': return '🗑️';
      default: return '📋';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatJSON = (data: any) => {
    if (!data) return '{}';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* Header con refresh */}
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Logs de Auditoría - Productos</h3>
          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
            {totalCount} registros
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          title="Refrescar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
          <p className="mt-3 text-gray-600">Cargando auditoría...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Usuario</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acción</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Producto ID</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">IP</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay logs de auditoría para productos
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <>
                      <tr 
                        key={log.id}
                        className="border-t hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{log.usuario_email || 'Sistema'}</div>
                          {log.usuario_nombre && (
                            <div className="text-xs text-gray-500">{log.usuario_nombre}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1
                            ${getAccionColor(log.accion)}
                          `}>
                            <span>{getAccionIcon(log.accion)}</span>
                            {log.accion}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-gray-600">
                            {log.registro_id ? log.registro_id.substring(0, 8) + '...' : 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-sm text-gray-600">
                          {log.ip || '0.0.0.0'}
                        </td>
                        <td className="p-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            {expandedRow === log.id ? 'Ver menos' : 'Ver más'}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === log.id && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-3">
                              {/* Datos antes/después */}
                              {(log.datos_antes || log.datos_despues) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {log.datos_antes && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        Datos Antes:
                                      </h4>
                                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-60">
                                        {formatJSON(log.datos_antes)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.datos_despues && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Datos Después:
                                      </h4>
                                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-60">
                                        {formatJSON(log.datos_despues)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* User Agent */}
                              {log.user_agent && (
                                <div className="bg-gray-100 p-3 rounded-lg">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    User Agent:
                                  </h4>
                                  <p className="text-xs text-gray-600 break-all font-mono">{log.user_agent}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50/50">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages} · {totalCount} registros totales
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1 rounded border bg-black text-white">
                  {currentPage}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
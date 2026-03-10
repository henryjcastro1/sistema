"use client";

import { useState, useMemo } from "react";
import { Servicio, ServicioTableProps } from "../../servicios/types";
import { ToastContainer, useToast } from "../usuarios/Toast";

export default function ServicioTable({ 
  servicios, 
  loading, 
  onRefresh, 
  onView,
  onEdit,
  onAsignar,
  onTomar,           // 👈 NUEVA PROP
  onCompletar,       // 👈 NUEVA PROP
  onCancelar,
  esAdmin = false,
  esTecnico = false
}: ServicioTableProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterPrioridad, setFilterPrioridad] = useState<string>("TODOS");

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'SOLICITADO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EN_PROCESO': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'COMPLETADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELADO': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string): string => {
    switch (estado) {
      case 'SOLICITADO': return '🆕';
      case 'EN_PROCESO': return '⚙️';
      case 'COMPLETADO': return '✅';
      case 'CANCELADO': return '❌';
      default: return '📋';
    }
  };

  const getPrioridadColor = (prioridad: number): string => {
    switch (prioridad) {
      case 1: return 'bg-red-100 text-red-700 border-red-200';
      case 2: return 'bg-orange-100 text-orange-700 border-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 4: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 5: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPrioridadTexto = (prioridad: number): string => {
    switch (prioridad) {
      case 1: return 'Crítico';
      case 2: return 'Alta';
      case 3: return 'Media';
      case 4: return 'Baja';
      case 5: return 'Muy Baja';
      default: return 'Desconocida';
    }
  };

  const getSLAColor = (servicio: Servicio): string => {
    if (!servicio.sla_deadline_solucion) return 'text-gray-400';
    if (servicio.estado === 'COMPLETADO' || servicio.estado === 'CANCELADO') return 'text-gray-400';
    
    const deadline = new Date(servicio.sla_deadline_solucion).getTime();
    const ahora = new Date().getTime();
    
    if (deadline < ahora) return 'text-red-600 font-bold';
    if (deadline - ahora < 60 * 60 * 1000) return 'text-orange-600 font-bold';
    return 'text-green-600';
  };

  // Filtrar servicios
  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const matchesSearch = searchTerm === "" || 
        s.numero_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cliente_nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.tecnico_nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === "TODOS" || s.estado === filterEstado;
      const matchesPrioridad = filterPrioridad === "TODOS" || s.prioridad.toString() === filterPrioridad;

      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  }, [servicios, searchTerm, filterEstado, filterPrioridad]);

  const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSLA = (servicio: Servicio): string => {
    if (!servicio.sla_deadline_solucion) return '-';
    if (servicio.estado === 'COMPLETADO') return 'Completado';
    if (servicio.estado === 'CANCELADO') return 'Cancelado';
    
    const deadline = new Date(servicio.sla_deadline_solucion);
    const ahora = new Date();
    const diffMs = deadline.getTime() - ahora.getTime();
    
    if (diffMs < 0) return '⚠️ Vencido';
    
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHoras > 24) return `${Math.floor(diffHoras / 24)}d restantes`;
    if (diffHoras > 0) return `${diffHoras}h ${diffMinutos}m restantes`;
    return `${diffMinutos}m restantes`;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por número, título, cliente o técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            {/* Filtro por Estado */}
            <div className="md:w-44">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📋 Todos los estados</option>
                <option value="SOLICITADO">🆕 Solicitado</option>
                <option value="EN_PROCESO">⚙️ En Proceso</option>
                <option value="COMPLETADO">✅ Completado</option>
                <option value="CANCELADO">❌ Cancelado</option>
              </select>
            </div>

            {/* Filtro por Prioridad */}
            <div className="md:w-40">
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">🔴 Todas las prioridades</option>
                <option value="1">🔴 Crítico (1)</option>
                <option value="2">🟠 Alta (2)</option>
                <option value="3">🟡 Media (3)</option>
                <option value="4">🟢 Baja (4)</option>
                <option value="5">🔵 Muy Baja (5)</option>
              </select>
            </div>

            {/* Contador */}
            <div className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">{filteredServicios.length}</span>
              <span className="text-gray-500 ml-1">servicios</span>
            </div>

            {/* Botón refrescar */}
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refrescar
            </button>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando servicios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">N° Servicio</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Título</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Técnico</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Prioridad</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">SLA</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredServicios.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No hay servicios registrados
                    </td>
                  </tr>
                ) : (
                  filteredServicios.map((s, index) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 font-mono text-sm">{index + 1}</td>
                      <td className="p-4">
                        <span className="font-mono font-medium text-gray-900">{s.numero_servicio}</span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-medium text-gray-900 truncate" title={s.titulo}>
                          {s.titulo}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{s.cliente_nombre || 'N/A'}</div>
                          {s.cliente_email && (
                            <div className="text-xs text-gray-500">{s.cliente_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm ${s.tecnico_nombre ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {s.tecnico_nombre || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(s.prioridad)}`}>
                          {getPrioridadTexto(s.prioridad)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getEstadoColor(s.estado)}`}>
                          <span>{getEstadoIcon(s.estado)}</span>
                          {s.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium ${getSLAColor(s)}`}>
                          {formatSLA(s)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(s.fecha_solicitado)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Ver detalle */}
                          <button
                            onClick={() => onView?.(s)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Asignar técnico (solo admin y solicitados) */}
                          {esAdmin && s.estado === 'SOLICITADO' && (
                            <button
                              onClick={() => onAsignar?.(s)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Asignar técnico"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </button>
                          )}

                          {/* Tomar servicio (técnico) - CORREGIDO: usa onTomar */}
                          {esTecnico && s.estado === 'SOLICITADO' && !s.tecnico_id && (
  <button
    onClick={() => onTomar?.(s)}
    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
    title="Tomar servicio"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  </button>
)}


                          {/* Completar servicio (técnico) - */}
{/* Completar servicio (técnico) */}
{(esTecnico || esAdmin) && s.estado === 'EN_PROCESO' && (
  <button
    onClick={() => onCompletar?.(s)}
    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
    title="Completar servicio"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
)}


                          {/* Cancelar (admin) */}
                          {esAdmin && s.estado !== 'COMPLETADO' && s.estado !== 'CANCELADO' && (
                            <button
                              onClick={() => onCancelar?.(s)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancelar servicio"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
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
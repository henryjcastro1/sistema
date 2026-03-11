"use client";

import { useState, useMemo } from "react";
import { PedidoTableProps } from "./types";
import { ToastContainer, useToast } from "../usuarios/Toast";

export default function PedidoTable({ 
  pedidos, 
  loading, 
  onRefresh,
  onEdit,
  onView,
  onPagar,
  onCambiarEstado
}: PedidoTableProps) {
  const [accionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterFecha, setFilterFecha] = useState<string>("TODOS");
  
  // 👇 NUEVOS ESTADOS PARA RANGO DE FECHAS
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [mostrarCalendarios, setMostrarCalendarios] = useState(false);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PAGADO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ENVIADO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ENTREGADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELADO': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  // Calcular las fechas límite fuera del useMemo
  const hoy = new Date();
  const hoyDateString = hoy.toDateString();
  const semanaLimite = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mesLimite = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Función para limpiar filtros de fecha
  const limpiarFiltrosFecha = () => {
    setFechaInicio("");
    setFechaFin("");
    setFilterFecha("TODOS");
    setMostrarCalendarios(false);
  };

  // Filtrar pedidos
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      const matchesSearch = searchTerm === "" || 
        p.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente_email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === "TODOS" || p.estado === filterEstado;

      const fechaPedido = new Date(p.created_at);
      
      // Filtro por rango de fechas personalizado
      let matchesFecha = true;
      
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        matchesFecha = fechaPedido >= inicio && fechaPedido <= fin;
      } else if (filterFecha !== "TODOS") {
        matchesFecha = 
          (filterFecha === "HOY" && fechaPedido.toDateString() === hoyDateString) ||
          (filterFecha === "SEMANA" && fechaPedido > semanaLimite) ||
          (filterFecha === "MES" && fechaPedido > mesLimite);
      }

      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [pedidos, searchTerm, filterEstado, filterFecha, fechaInicio, fechaFin, hoyDateString, semanaLimite, mesLimite]);

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

  const formatDateInput = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col gap-4">
            {/* Fila superior: buscador y filtros principales */}
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
                  placeholder="Buscar por número, cliente o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                />
              </div>

              {/* Filtro por Estado */}
              <div className="md:w-48">
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                >
                  <option value="TODOS">📋 Todos los estados</option>
                  <option value="PENDIENTE">⏳ Pendiente</option>
                  <option value="PAGADO">💰 Pagado</option>
                  <option value="ENVIADO">📦 Enviado</option>
                  <option value="ENTREGADO">✅ Entregado</option>
                  <option value="CANCELADO">❌ Cancelado</option>
                </select>
              </div>

              {/* Filtro por Fecha predefinido */}
              <div className="md:w-40">
                <select
                  value={filterFecha}
                  onChange={(e) => {
                    setFilterFecha(e.target.value);
                    if (e.target.value !== "TODOS") {
                      setMostrarCalendarios(false);
                      setFechaInicio("");
                      setFechaFin("");
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                >
                  <option value="TODOS">📅 Todas las fechas</option>
                  <option value="HOY">🟢 Hoy</option>
                  <option value="SEMANA">📆 Esta semana</option>
                  <option value="MES">📅 Este mes</option>
                  <option value="RANGO">🔍 Rango personalizado</option>
                </select>
              </div>

              {/* Botón para limpiar filtros */}
              {(fechaInicio || fechaFin || filterFecha !== "TODOS") && (
                <button
                  onClick={limpiarFiltrosFecha}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200 hover:border-red-300"
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </span>
                </button>
              )}

              {/* Contador */}
              <div className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-900">{filteredPedidos.length}</span>
                <span className="text-gray-500 ml-1">pedidos</span>
              </div>
            </div>

            {/* Fila inferior: calendarios para rango personalizado */}
            {(filterFecha === "RANGO" || mostrarCalendarios) && (
              <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-100 p-4 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={formatDateInput(fechaInicio)}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setFilterFecha("RANGO");
                      setMostrarCalendarios(true);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={formatDateInput(fechaFin)}
                    min={formatDateInput(fechaInicio)}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setFilterFecha("RANGO");
                      setMostrarCalendarios(true);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                  />
                </div>
                <button
                  onClick={() => {
                    setMostrarCalendarios(false);
                    if (!fechaInicio || !fechaFin) {
                      setFilterFecha("TODOS");
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition border border-gray-200"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla (resto del código igual) */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">N° Pedido</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay pedidos registrados
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((p, index) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 font-mono text-sm">
                        {index + 1}
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium text-gray-900">{p.numero_pedido}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{p.cliente_nombre}</div>
                        <div className="text-xs text-gray-500">{p.cliente_email}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {formatCurrency(p.total_final)}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getEstadoColor(p.estado)}`}>
                          <span>{getEstadoIcon(p.estado)}</span>
                          {p.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Botones de acción (igual que antes) */}
                          <button
                            onClick={() => onView?.(p)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all group relative border border-blue-200 hover:border-blue-300"
                            title="Ver detalle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {p.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => onPagar?.(p)}
                              disabled={accionLoading === p.id}
                              className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 group relative border border-green-200 hover:border-green-300"
                              title="Pagar pedido"
                            >
                              {accionLoading === p.id ? (
                                <span className="animate-spin border-2 border-green-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              )}
                            </button>
                          )}

                          {(p.estado === 'PAGADO' || p.estado === 'ENVIADO') && (
                            <button
                              onClick={() => onCambiarEstado?.(p)}
                              className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all group relative border border-purple-200 hover:border-purple-300"
                              title="Cambiar estado de envío"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </button>
                          )}

                          {p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && (
                            <button
                              onClick={() => onEdit?.(p)}
                              className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all group relative border border-amber-200 hover:border-amber-300"
                              title="Editar pedido"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
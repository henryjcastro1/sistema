"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ServicioDetalleProps, getCategoriaConfig } from "../../servicios/types";

export default function ServicioDetalle({
  servicio,
  isOpen,
  onClose,
  onCompletar,
  esAdmin = false,
  esTecnico = false
}: ServicioDetalleProps) {

  if (!servicio) return null;

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEstadoStyles = (estado: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      SOLICITADO: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        icon: "⏳"
      },
      ASIGNADO: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        icon: "👤"
      },
      EN_PROCESO: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        icon: "🛠️"
      },
      COMPLETADO: {
        bg: "bg-green-50",
        text: "text-green-700",
        icon: "✅"
      },
      CANCELADO: {
        bg: "bg-red-50",
        text: "text-red-700",
        icon: "❌"
      }
    };
    return styles[estado] || styles.SOLICITADO;
  };

  const getPrioridadInfo = (prioridad: number) => {
    const info: Record<number, { color: string; bg: string; label: string }> = {
      1: { color: "text-red-600", bg: "bg-red-50", label: "Crítica" },
      2: { color: "text-orange-600", bg: "bg-orange-50", label: "Alta" },
      3: { color: "text-yellow-600", bg: "bg-yellow-50", label: "Media" },
      4: { color: "text-green-600", bg: "bg-green-50", label: "Baja" },
      5: { color: "text-gray-600", bg: "bg-gray-50", label: "Muy Baja" }
    };
    return info[prioridad] || info[3];
  };

  const estadoStyle = getEstadoStyles(servicio.estado);
  const prioridadInfo = getPrioridadInfo(servicio.prioridad);
  const categoriaConfig = getCategoriaConfig(servicio.categoria_nombre);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header con gradiente - fijo */}
              <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 flex-shrink-0">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${estadoStyle.bg} ${estadoStyle.text}`}>
                        <span>{estadoStyle.icon}</span>
                        <span>{servicio.estado.replace("_", " ")}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${prioridadInfo.bg} ${prioridadInfo.color}`}>
                        Prioridad {prioridadInfo.label}
                      </div>
                      {servicio.categoria_nombre && (
                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${categoriaConfig.bgColor} ${categoriaConfig.color}`}>
                          <span>{categoriaConfig.icono}</span>
                          <span>{servicio.categoria_nombre}</span>
                        </div>
                      )}
                    </div>
                    <Dialog.Title className="text-2xl font-bold text-white mb-1 break-words">
                      Servicio #{servicio.numero_servicio}
                    </Dialog.Title>
                    <p className="text-gray-300 text-sm break-words max-w-full">
                      {servicio.titulo}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-all hover:scale-110 flex-shrink-0 ml-4"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>

              {/* Body con scroll - contenido scrollable */}
              <div className="overflow-y-auto flex-1">
                <div className="p-8 space-y-8">
                  {/* Información de la Categoría */}
                  {servicio.categoria_nombre && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{categoriaConfig.icono}</span>
                        <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                          Categoría del Servicio
                        </h3>
                      </div>
                      <p className="text-lg font-semibold text-amber-900 break-words">
                        {servicio.categoria_nombre}
                      </p>
                    </div>
                  )}

                  {/* Cliente y Técnico - Grid moderna */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">👤</span>
                        <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                          Cliente
                        </h3>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg mb-2 break-words">
                        {servicio.cliente_nombre || "N/A"}
                      </p>
                      <div className="space-y-2">
                        {servicio.cliente_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 break-all">
                            <span>📧</span>
                            <span className="break-all">{servicio.cliente_email}</span>
                          </div>
                        )}
                        {servicio.cliente_telefono && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📱</span>
                            <span>{servicio.cliente_telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🛠️</span>
                        <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                          Técnico Asignado
                        </h3>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg mb-2 break-words">
                        {servicio.tecnico_nombre || "Sin asignar"}
                      </p>
                      {servicio.fecha_asignado && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <span>📅</span>
                          <span>Asignado: {formatDate(servicio.fecha_asignado)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción - Tarjeta mejorada con scroll interno si es muy larga */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 p-6 pb-0">
                      <span className="text-xl">📄</span>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Descripción del Servicio
                      </h3>
                    </div>
                    <div className="p-6 pt-3">
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                        {servicio.descripcion || "Sin descripción proporcionada"}
                      </div>
                    </div>
                  </div>

                  {/* Información Económica - Grid moderna */}
                  {(servicio.presupuesto || servicio.costo_final) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">💰</span>
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                            Presupuesto Estimado
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">
                          {formatCurrency(servicio.presupuesto)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-lime-50 p-5 rounded-2xl border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">✓</span>
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            Costo Final
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(servicio.costo_final)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline de Fechas */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6 flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      Línea de Tiempo
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-xl flex-shrink-0">⏰</span>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Solicitado</p>
                          <p className="font-medium text-gray-900 break-words">{formatDate(servicio.fecha_solicitado)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-xl flex-shrink-0">⏳</span>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Deadline Solución</p>
                          <p className="font-medium text-gray-900 break-words">{formatDate(servicio.sla_deadline_solucion)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-xl flex-shrink-0">✅</span>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Completado</p>
                          <p className="font-medium text-gray-900 break-words">{formatDate(servicio.fecha_completado)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con acciones - fijo */}
              <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-end gap-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium transition-all"
                >
                  Cerrar
                </button>

                {esTecnico &&
                  servicio.tecnico_id &&
                  servicio.estado === "EN_PROCESO" &&
                  onCompletar && (
                    <button
                      onClick={() => onCompletar(servicio)}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">✓</span>
                      Completar Servicio
                    </button>
                  )}

                {esAdmin && servicio.estado === "SOLICITADO" && (
                  <button
                    onClick={() => {
                      // Función para asignar técnico
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span className="text-lg">👤</span>
                    Asignar Técnico
                  </button>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
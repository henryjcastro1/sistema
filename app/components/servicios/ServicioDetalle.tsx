"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ServicioDetalleProps } from "../../servicios/types";

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
    return new Date(date).toLocaleString("es-CO");
  };

const estadoStyles: Record<string, string> = {
  SOLICITADO: "bg-blue-100 text-blue-700",
  EN_PROCESO: "bg-yellow-100 text-yellow-700",
  COMPLETADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700"
};

  const prioridadColor = (p: number) => {
    if (p <= 2) return "text-red-600";
    if (p === 3) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm"/>
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >

            <Dialog.Panel className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">

              {/* HEADER */}
              <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-start">

                <div>
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Servicio #{servicio.numero_servicio}
                  </Dialog.Title>

                  <p className="text-gray-600 text-sm mt-1">
                    {servicio.titulo}
                  </p>

                  <div className="flex gap-3 mt-3">

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoStyles[servicio.estado]}`}>
                      {servicio.estado.replace("_", " ")}
                    </span>

                    <span className={`text-sm font-semibold ${prioridadColor(servicio.prioridad)}`}>
                      Prioridad {servicio.prioridad}
                    </span>

                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-700 transition"
                >
                  ✕
                </button>

              </div>

              {/* BODY */}
              <div className="p-6 space-y-6">

                {/* CLIENTE + TECNICO */}
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      Cliente
                    </h3>

                    <p className="font-medium text-gray-900">
                      {servicio.cliente_nombre || "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {servicio.cliente_email}
                    </p>

                    <p className="text-sm text-gray-600">
                      {servicio.cliente_telefono}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      Técnico
                    </h3>

                    <p className="font-medium text-gray-900">
                      {servicio.tecnico_nombre || "Sin asignar"}
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      Asignado: {formatDate(servicio.fecha_asignado)}
                    </p>
                  </div>

                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">
                    Descripción del servicio
                  </h3>

                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700">
                    {servicio.descripcion || "Sin descripción"}
                  </div>
                </div>

                {/* ECONÓMICO */}
                {(servicio.presupuesto || servicio.costo_final) && (

                  <div className="grid grid-cols-2 gap-6">

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">
                        Presupuesto
                      </p>

                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(servicio.presupuesto)}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">
                        Costo final
                      </p>

                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(servicio.costo_final)}
                      </p>
                    </div>

                  </div>
                )}

                {/* FECHAS */}
                <div className="grid md:grid-cols-3 gap-4">

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Solicitado</p>
                    <p className="font-medium">{formatDate(servicio.fecha_solicitado)}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Deadline solución</p>
                    <p className="font-medium">{formatDate(servicio.sla_deadline_solucion)}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Completado</p>
                    <p className="font-medium">{formatDate(servicio.fecha_completado)}</p>
                  </div>

                </div>

              </div>

              {/* FOOTER */}
              <div className="border-t px-6 py-4 flex justify-end gap-3">

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm"
                >
                  Cerrar
                </button>

                {esTecnico &&
                  servicio.tecnico_id &&
                  servicio.estado === "EN_PROCESO" &&
                  onCompletar && (

                    <button
                      onClick={() => onCompletar(servicio)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm shadow"
                    >
                      Completar servicio
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
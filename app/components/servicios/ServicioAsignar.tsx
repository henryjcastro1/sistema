"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ServicioAsignarProps, TecnicoDisponible } from "../../servicios/types";

export default function ServicioAsignar({ 
  servicio, 
  isOpen, 
  onClose,
  onAsignar,
  tecnicos,
  loading = false
}: ServicioAsignarProps) {
  
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>("");
  const [asignando, setAsignando] = useState(false);

  if (!servicio) return null;

  const handleAsignar = async () => {
    if (!tecnicoSeleccionado) return;
    
    setAsignando(true);
    try {
      await onAsignar(servicio.id, tecnicoSeleccionado);
      setTecnicoSeleccionado("");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setAsignando(false);
    }
  };

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
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                  Asignar Técnico
                </Dialog.Title>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Servicio:</span> {servicio.numero_servicio}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-medium">Título:</span> {servicio.titulo}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-medium">Prioridad:</span>{' '}
                    {servicio.prioridad === 1 && '🔴 Crítico'}
                    {servicio.prioridad === 2 && '🟠 Alta'}
                    {servicio.prioridad === 3 && '🟡 Media'}
                    {servicio.prioridad === 4 && '🟢 Baja'}
                    {servicio.prioridad === 5 && '🔵 Muy Baja'}
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
                    <p className="mt-3 text-gray-600">Cargando técnicos disponibles...</p>
                  </div>
                ) : tecnicos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay técnicos disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                    {tecnicos.map((tecnico: TecnicoDisponible) => (
                      <label
                        key={tecnico.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${
                          tecnicoSeleccionado === tecnico.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tecnico"
                          value={tecnico.id}
                          checked={tecnicoSeleccionado === tecnico.id}
                          onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tecnico.nombre} {tecnico.apellido}
                              </p>
                              <p className="text-sm text-gray-600">{tecnico.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{tecnico.servicios_activos}</span> servicios activos
                              </p>
                              {tecnico.calificacion_promedio && (
                                <p className="text-sm text-yellow-600">
                                  ⭐ {tecnico.calificacion_promedio.toFixed(1)}
                                </p>
                              )}
                            </div>
                          </div>
                          {tecnico.servicios_activos >= 3 && (
                            <p className="text-xs text-orange-600 mt-2">
                              ⚠️ Este técnico tiene {tecnico.servicios_activos} servicios en proceso
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignar}
                    disabled={!tecnicoSeleccionado || asignando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {asignando ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                        Asignando...
                      </span>
                    ) : (
                      'Asignar Técnico'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
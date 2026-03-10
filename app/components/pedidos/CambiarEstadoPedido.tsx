"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

interface CambiarEstadoPedidoProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: {
    id: string;
    numero_pedido: string;
    estado: string;
  } | null;
  onCambiarEstado: (pedidoId: string, nuevoEstado: string) => Promise<void>;
}

export default function CambiarEstadoPedido({ 
  isOpen, 
  onClose, 
  pedido, 
  onCambiarEstado 
}: CambiarEstadoPedidoProps) {
  
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Reset cuando se abre el modal
  if (isOpen && pedido && nuevoEstado === "") {
    setNuevoEstado(pedido.estado);
  }

  const estadosPermitidos = [
    { valor: 'ENVIADO', label: '📦 Enviado', color: 'purple' },
    { valor: 'ENTREGADO', label: '✅ Entregado', color: 'green' },
    { valor: 'CANCELADO', label: '❌ Cancelado', color: 'red' },
  ];

  const getEstadoActualColor = (estado: string): string => {
    switch(estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700';
      case 'PAGADO': return 'bg-blue-100 text-blue-700';
      case 'ENVIADO': return 'bg-purple-100 text-purple-700';
      case 'ENTREGADO': return 'bg-green-100 text-green-700';
      case 'CANCELADO': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido || nuevoEstado === pedido.estado) return;
    
    setLoading(true);
    try {
      await onCambiarEstado(pedido.id, nuevoEstado);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!pedido) return null;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                  Cambiar Estado del Pedido
                </Dialog.Title>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Pedido: <span className="font-medium text-gray-900">{pedido.numero_pedido}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Estado actual:{' '}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoActualColor(pedido.estado)}`}>
                      {pedido.estado}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuevo Estado
                    </label>
                    <div className="space-y-2">
                      {estadosPermitidos.map((estado) => (
                        <label
                          key={estado.valor}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            nuevoEstado === estado.valor
                              ? `border-${estado.color}-500 bg-${estado.color}-50`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="estado"
                            value={estado.valor}
                            checked={nuevoEstado === estado.valor}
                            onChange={(e) => setNuevoEstado(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-900">{estado.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || nuevoEstado === pedido.estado}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                          Actualizando...
                        </>
                      ) : (
                        'Actualizar Estado'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
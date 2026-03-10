"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Servicio, ServicioFormData } from "../../servicios/types";

interface ServicioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServicioFormData) => Promise<void>;
  servicio?: Servicio | null;
  esAdmin?: boolean;  // 👈 Nueva prop para saber si es admin
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

export default function ServicioForm({ 
  isOpen, 
  onClose, 
  onSave,
  servicio,
  esAdmin = false  // 👈 Por defecto false
}: ServicioFormProps) {
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    prioridad: 3,
    direccion: "",
    cliente_id: ""  // 👈 Nuevo campo para el cliente
  });
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar clientes cuando se abre el modal (solo para admins)
  useEffect(() => {
    if (isOpen && esAdmin && !servicio) {
      cargarClientes();
    }
  }, [isOpen, esAdmin, servicio]);

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (servicio) {
      setFormData({
        titulo: servicio.titulo || "",
        descripcion: servicio.descripcion || "",
        prioridad: servicio.prioridad || 3,
        direccion: servicio.direccion || "",
        cliente_id: "" // En edición no se puede cambiar el cliente
      });
    } else {
      setFormData({
        titulo: "",
        descripcion: "",
        prioridad: 3,
        direccion: "",
        cliente_id: ""
      });
    }
    setErrors({});
  }, [servicio, isOpen]);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const res = await fetch('/api/usuarios?rol=CLIENTE', { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      } else {
        console.error('Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es requerido";
    }
    
    // Si es admin y es un servicio nuevo, validar que seleccione cliente
    if (esAdmin && !servicio && !formData.cliente_id) {
      newErrors.cliente_id = "Debe seleccionar un cliente";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prioridad' ? parseInt(value) : value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
                  {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selector de Cliente - SOLO PARA ADMINS y SOLO en creación */}
                  {esAdmin && !servicio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente *
                      </label>
                      <select
                        name="cliente_id"
                        value={formData.cliente_id}
                        onChange={handleChange}
                        disabled={loadingClientes}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-white ${
                          errors.cliente_id ? 'border-red-500' : 'border-gray-200'
                        }`}
                      >
                        <option value="">
                          {loadingClientes ? 'Cargando clientes...' : 'Seleccionar cliente...'}
                        </option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} {cliente.apellido} - {cliente.email}
                          </option>
                        ))}
                      </select>
                      {errors.cliente_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>
                      )}
                      {clientes.length === 0 && !loadingClientes && (
                        <p className="mt-1 text-sm text-amber-600">
                          No hay clientes disponibles
                        </p>
                      )}
                    </div>
                  )}

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition ${
                        errors.titulo ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Ej: Reparación de PC"
                    />
                    {errors.titulo && (
                      <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition resize-none"
                      placeholder="Describe el servicio en detalle..."
                    />
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                    >
                      <option value={5}>🔵 Muy Baja (5)</option>
                      <option value={4}>🟢 Baja (4)</option>
                      <option value={3}>🟡 Media (3)</option>
                      <option value={2}>🟠 Alta (2)</option>
                      <option value={1}>🔴 Crítico (1)</option>
                    </select>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                      placeholder="Dirección donde se realizará el servicio"
                    />
                  </div>

                  {/* Botones */}
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
                      disabled={loading}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                          Guardando...
                        </>
                      ) : (
                        'Guardar Servicio'
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
// app/components/servicios/ServicioForm.tsx
"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Servicio, ServicioFormData, CategoriaServicio } from "../../servicios/types";

interface ServicioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServicioFormData) => Promise<void>;
  servicio?: Servicio | null;
  esAdmin?: boolean;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

// Iconos y colores por categoría
const categoriaConfig: Record<string, { icono: string; color: string }> = {
  'Desarrollo Web': { icono: '🌐', color: 'bg-blue-100 text-blue-700' },
  'Desarrollo Software': { icono: '💻', color: 'bg-purple-100 text-purple-700' },
  'Desarrollo Apps Móviles': { icono: '📱', color: 'bg-green-100 text-green-700' },
  'Soporte Técnico': { icono: '🛠️', color: 'bg-orange-100 text-orange-700' },
  'Gestión de Redes': { icono: '🔌', color: 'bg-cyan-100 text-cyan-700' },
  'Ciberseguridad': { icono: '🔒', color: 'bg-red-100 text-red-700' },
  'Consultoría IT': { icono: '📊', color: 'bg-indigo-100 text-indigo-700' },
  'Migración a la Nube': { icono: '☁️', color: 'bg-sky-100 text-sky-700' },
  'Pruebas de Software': { icono: '🧪', color: 'bg-emerald-100 text-emerald-700' }
};

export default function ServicioForm({ 
  isOpen, 
  onClose, 
  onSave,
  servicio,
  esAdmin = false
}: ServicioFormProps) {
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    prioridad: 3,
    direccion: "",
    categoria_id: "",  // 👈 Nuevo campo
    cliente_id: ""
  });
  
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar categorías al abrir
  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
      if (esAdmin && !servicio) {
        cargarClientes();
      }
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
        categoria_id: servicio.categoria_id || "",
        cliente_id: ""
      });
    } else {
      setFormData({
        titulo: "",
        descripcion: "",
        prioridad: 3,
        direccion: "",
        categoria_id: "",
        cliente_id: ""
      });
    }
    setErrors({});
  }, [servicio, isOpen]);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const res = await fetch('/api/categorias-servicio', { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      } else {
        console.error('Error al cargar categorías');
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const res = await fetch('/api/usuarios?rol=CLIENTE', { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
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
    
    if (!formData.categoria_id) {
      newErrors.categoria_id = "Debe seleccionar una categoría de servicio";
    }
    
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
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getCategoriaConfig = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return { icono: '📋', color: 'bg-gray-100 text-gray-700' };
    return categoriaConfig[categoria.nombre] || { icono: categoria.icono || '📋', color: 'bg-gray-100 text-gray-700' };
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
                  {/* Selector de Cliente - SOLO PARA ADMINS */}
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
                    </div>
                  )}

                  {/* CATEGORÍA DE SERVICIO - NUEVO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría del Servicio *
                    </label>
                    <select
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleChange}
                      disabled={loadingCategorias}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-white ${
                        errors.categoria_id ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">
                        {loadingCategorias ? 'Cargando categorías...' : 'Seleccionar categoría...'}
                      </option>
                      {categorias.map((categoria) => {
                        const config = categoriaConfig[categoria.nombre] || { icono: '📋', color: '' };
                        return (
                          <option key={categoria.id} value={categoria.id}>
                            {config.icono} {categoria.nombre}
                          </option>
                        );
                      })}
                    </select>
                    {errors.categoria_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
                    )}
                    {formData.categoria_id && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getCategoriaConfig(formData.categoria_id).color}`}>
                          {getCategoriaConfig(formData.categoria_id).icono}
                          {categorias.find(c => c.id === formData.categoria_id)?.nombre}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del Servicio *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition ${
                        errors.titulo ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Ej: Desarrollo de tienda online"
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
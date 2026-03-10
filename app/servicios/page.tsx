"use client";

import { useEffect, useState } from "react";
import { Servicio, ServicioFormData, ServicioStats, TecnicoDisponible } from "./types";
import ServicioTable from "../components/servicios/ServicioTable";
import ServicioDetalle from "../components/servicios/ServicioDetalle";
import ServicioAsignar from "../components/servicios/ServicioAsignar";
import ServicioForm from "../components/servicios/ServicioForm";
import { ToastContainer, useToast } from "../components/usuarios/Toast";
import CompletarServicioModal from "../components/servicios/CompletarServicioModal";

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<ServicioStats>({
    total: 0,
    solicitados: 0,
    en_proceso: 0,
    completados_hoy: 0,
    vencidos: 0
  });
  
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [servicioToView, setServicioToView] = useState<Servicio | null>(null);
  const [servicioToEdit, setServicioToEdit] = useState<Servicio | null>(null);
  const [tecnicos, setTecnicos] = useState<TecnicoDisponible[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [completarOpen, setCompletarOpen] = useState(false);
  const [servicioToComplete, setServicioToComplete] = useState<Servicio | null>(null);
  
  const { toasts, showToast, removeToast } = useToast();
  
  // Obtener rol del usuario (simulado - deberías obtenerlo del contexto/auth)
  const [userRol, setUserRol] = useState<'ADMIN' | 'TECNICO' | 'CLIENTE'>('ADMIN');

  const esAdmin = userRol === 'ADMIN';
  const esTecnico = userRol === 'TECNICO';
  const esCliente = userRol === 'CLIENTE';

  async function loadServicios() {
    try {
      setLoading(true);
      const res = await fetch("/api/servicios", { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setServicios(data);
      
      // Calcular estadísticas
      const hoy = new Date().toDateString();
      const stats: ServicioStats = {
        total: data.length,
        solicitados: data.filter((s: Servicio) => s.estado === 'SOLICITADO').length,
        en_proceso: data.filter((s: Servicio) => s.estado === 'EN_PROCESO').length,
        completados_hoy: data.filter((s: Servicio) => 
          s.estado === 'COMPLETADO' && 
          new Date(s.fecha_completado || '').toDateString() === hoy
        ).length,
        vencidos: data.filter((s: Servicio) => {
          if (s.estado === 'COMPLETADO' || s.estado === 'CANCELADO' || !s.sla_deadline_solucion) return false;
          return new Date(s.sla_deadline_solucion) < new Date();
        }).length
      };
      
      // Calcular promedio de calificación
      const calificaciones = data
        .filter((s: Servicio) => s.calificacion !== null && s.calificacion !== undefined)
        .map((s: Servicio) => Number(s.calificacion));

      if (calificaciones.length > 0) {
        const suma = calificaciones.reduce((total: number, calificacion: number) => total + calificacion, 0);
        stats.promedio_calificacion = suma / calificaciones.length;
      }
      
      setStats(stats);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }

  async function loadTecnicos() {
    try {
      setLoadingTecnicos(true);
      const res = await fetch("/api/servicios/tecnicos", { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTecnicos(data);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar técnicos", "error");
    } finally {
      setLoadingTecnicos(false);
    }
  }

  useEffect(() => { loadServicios(); }, []);

  // Tomar servicio (técnico se auto-asigna)
  const handleTomarServicio = async (servicio: Servicio) => {
    try {
      const res = await fetch(`/api/servicios/${servicio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'EN_PROCESO' }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al tomar el servicio');
      
      showToast('✅ Servicio tomado correctamente', 'success');
      loadServicios();
    } catch (error) {
      showToast('Error al tomar el servicio', 'error');
    }
  };

  // Abrir modal para completar servicio
  const handleCompletarServicio = (servicio: Servicio) => {
    setServicioToComplete(servicio);
    setCompletarOpen(true);
  };

  // Completar servicio (llamado desde el modal)
  const completarServicio = async (costo: number, comentario: string) => {
    if (!servicioToComplete) return;

    try {
      const res = await fetch(`/api/servicios/${servicioToComplete.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          estado: "COMPLETADO",
          costo_final: costo,
          comentario_final: comentario
        }),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Error al completar el servicio");
      }

      showToast("✅ Servicio completado", "success");
      setCompletarOpen(false);
      setServicioToComplete(null);
      loadServicios();
    } catch (error) {
      showToast("Error al completar el servicio", "error");
    }
  };

  // Cancelar servicio
  const handleCancelarServicio = async (servicio: Servicio) => {
    if (!confirm("¿Estás seguro de cancelar este servicio?")) return;

    try {
      const res = await fetch(`/api/servicios/${servicio.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          estado: "CANCELADO"
        }),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Error al cancelar el servicio");
      }

      showToast("✅ Servicio cancelado", "success");
      loadServicios();
    } catch (error) {
      showToast("Error al cancelar el servicio", "error");
    }
  };

  // Calificar servicio (cliente)
  const handleCalificarServicio = async (servicio: Servicio, calificacion: number, comentario?: string) => {
    try {
      const res = await fetch(`/api/servicios/${servicio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          calificacion,
          comentario_cliente: comentario
        }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al calificar el servicio');
      
      showToast('✅ Gracias por tu calificación', 'success');
      loadServicios();
    } catch (error) {
      showToast('Error al calificar', 'error');
    }
  };

  const handleView = (servicio: Servicio) => {
    setServicioToView(servicio);
    setDetalleOpen(true);
  };

  const handleAsignarClick = (servicio: Servicio) => {
    setServicioToView(servicio);
    loadTecnicos();
    setAsignarOpen(true);
  };

  const handleAsignar = async (servicioId: string, tecnicoId: string) => {
    try {
      const res = await fetch(`/api/servicios/${servicioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tecnico_id: tecnicoId,
          estado: 'EN_PROCESO',
          fecha_asignado: new Date().toISOString()
        }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al asignar técnico');
      
      showToast('✅ Técnico asignado correctamente', 'success');
      setAsignarOpen(false);
      loadServicios();
    } catch (error) {
      showToast('Error al asignar técnico', 'error');
    }
  };

  const handleNuevoServicio = () => {
    setServicioToEdit(null);
    setFormOpen(true);
  };

  const handleGuardarServicio = async (formData: ServicioFormData) => {
    try {
      const res = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear servicio');
      }
      
      showToast('✅ Servicio creado correctamente', 'success');
      setFormOpen(false);
      loadServicios();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Error al crear servicio', 'error');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios Técnicos</h1>
          <p className="text-gray-600 mt-1">Gestiona todos los servicios y asignaciones</p>
        </div>
        
        {/* Botón nuevo servicio (todos pueden crear) */}
        <button
          onClick={handleNuevoServicio}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Servicio
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.solicitados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados Hoy</p>
              <p className="text-2xl font-bold text-green-600">{stats.completados_hoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Calificación</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.promedio_calificacion?.toFixed(1) || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla de servicios */}
      <ServicioTable
        servicios={servicios}
        loading={loading}
        onRefresh={loadServicios}
        onView={handleView}
        onAsignar={handleAsignarClick}
        onTomar={handleTomarServicio}        
        onCompletar={handleCompletarServicio} 
        onCancelar={handleCancelarServicio}
        esAdmin={esAdmin}
        esTecnico={esTecnico}
      />

      {/* Modales */}
      <ServicioDetalle
        servicio={servicioToView}
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        onAsignar={handleAsignarClick}
        onTomar={handleTomarServicio}
        onCompletar={handleCompletarServicio}
        onCancelar={handleCancelarServicio}
        esAdmin={esAdmin}
        esTecnico={esTecnico}
      />

      <ServicioAsignar
        servicio={servicioToView}
        isOpen={asignarOpen}
        onClose={() => setAsignarOpen(false)}
        onAsignar={handleAsignar}
        tecnicos={tecnicos}
        loading={loadingTecnicos}
      />

      <ServicioForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleGuardarServicio}
        servicio={servicioToEdit}
        esAdmin={esAdmin}
      />

<CompletarServicioModal
  open={completarOpen}
  onClose={() => setCompletarOpen(false)}
  onConfirm={completarServicio}
  servicio={servicioToComplete}
/>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
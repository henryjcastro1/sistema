"use client";

import { useEffect, useState } from "react";
import AuditFilters from "@/app/components/auditorias/AuditFilters";
import AuditTable from "@/app/components/auditorias/AuditTable";
import { AuditLog, FilterParams } from "./types";

export default function AuditoriaUsuariosPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<FilterParams>({});
  const [error, setError] = useState("");

  async function loadAuditLogs(page = currentPage, filterParams = filters) {
    try {
      setLoading(true);
      
      // Construir query string con filtros
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (filterParams.fechaInicio) params.append('fechaInicio', filterParams.fechaInicio);
      if (filterParams.fechaFin) params.append('fechaFin', filterParams.fechaFin);
      if (filterParams.accion && filterParams.accion !== 'TODAS') params.append('accion', filterParams.accion);
      if (filterParams.usuario) params.append('usuario', filterParams.usuario);
      if (filterParams.registro_id) params.append('registro_id', filterParams.registro_id);

      const res = await fetch(`/api/auditoria/usuarios?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar auditoría");
      }

      const data = await res.json();
      setLogs(data.logs);
      setTotalCount(data.total);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar los logs de auditoría");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs(currentPage, filters);
  }, [currentPage]);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a primera página al filtrar
    loadAuditLogs(1, newFilters);
  };

  const handleRefresh = () => {
    loadAuditLogs(currentPage, filters);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auditoría de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Visualiza todos los cambios y acciones realizadas sobre los usuarios
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          {totalCount} registros totales
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros */}
      <AuditFilters 
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Tabla de auditoría */}
      <AuditTable
        logs={logs}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onRefresh={handleRefresh}
      />

      {/* Leyenda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">📋 Leyenda de acciones:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <span><span className="bg-green-100 px-2 py-1 rounded">LOGIN</span> - Inicio de sesión</span>
          <span><span className="bg-gray-100 px-2 py-1 rounded">LOGOUT</span> - Cierre de sesión</span>
          <span><span className="bg-blue-100 px-2 py-1 rounded">CREAR</span> - Usuario creado</span>
          <span><span className="bg-purple-100 px-2 py-1 rounded">ACTUALIZAR</span> - Datos editados</span>
          <span><span className="bg-red-100 px-2 py-1 rounded">BLOQUEAR</span> - Usuario bloqueado</span>
          <span><span className="bg-emerald-100 px-2 py-1 rounded">ACTIVAR</span> - Usuario activado</span>
          <span><span className="bg-indigo-100 px-2 py-1 rounded">VERIFICAR</span> - Email verificado</span>
          <span><span className="bg-amber-100 px-2 py-1 rounded">CAMBIO_PASSWORD</span> - Contraseña cambiada</span>
        </div>
      </div>
    </div>
  );
}
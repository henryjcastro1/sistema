"use client";

import { useEffect, useState } from "react";
import { FilterParams } from "../types";
import AuditFilters from "@/app/components/auditorias/productos/AuditFiltersProductos";
import AuditTable from "@/app/components/auditorias/productos/AuditTableProductos";
import { AuditLog } from "@/app/productos/types";

export default function AuditoriaProductosPage() {
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
      params.append('tabla', 'productos'); // 👈 Filtro para productos
      
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
          <h1 className="text-3xl font-bold text-gray-900">Auditoría de Productos</h1>
          <p className="text-gray-600 mt-1">
            Visualiza todos los cambios y acciones realizadas sobre los productos
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Última actualización: {new Date().toLocaleTimeString()}
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
        <h3 className="font-semibold mb-2">📋 Leyenda de acciones en productos:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <span><span className="bg-green-100 px-2 py-1 rounded">➕ CREAR</span> - Producto creado</span>
          <span><span className="bg-blue-100 px-2 py-1 rounded">✏️ ACTUALIZAR</span> - Datos editados</span>
          <span><span className="bg-emerald-100 px-2 py-1 rounded">✅ ACTIVAR</span> - Producto activado</span>
          <span><span className="bg-orange-100 px-2 py-1 rounded">❌ DESACTIVAR</span> - Producto desactivado</span>
          <span><span className="bg-red-100 px-2 py-1 rounded">🗑️ ELIMINAR</span> - Producto eliminado</span>
        </div>
      </div>
    </div>
  );
}
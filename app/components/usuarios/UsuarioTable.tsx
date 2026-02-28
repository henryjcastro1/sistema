"use client";

import { useState, useMemo } from "react";
import { UsuarioTableProps } from "./types";
import { useToast, ToastContainer } from "./Toast";

export default function UsuarioTable({ usuarios, loading, onRefresh, onEdit, onChangePassword   }: UsuarioTableProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");

  const getRolBadgeClass = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'TECNICO':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CLIENTE':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (nombre: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = nombre.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Filtrar usuarios basado en búsqueda y filtros
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => {
      const matchesSearch = searchTerm === "" || 
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.telefono && u.telefono.includes(searchTerm));

      const matchesRol = filterRol === "TODOS" || u.rol_nombre === filterRol;
      const matchesEstado = filterEstado === "TODOS" || 
        (filterEstado === "ACTIVO" && !u.bloqueado) ||
        (filterEstado === "BLOQUEADO" && u.bloqueado);

      return matchesSearch && matchesRol && matchesEstado;
    });
  }, [usuarios, searchTerm, filterRol, filterEstado]);

  // Obtener roles únicos para el filtro
  const rolesUnicos = useMemo(() => {
    const roles = new Set(usuarios.map(u => u.rol_nombre));
    return Array.from(roles);
  }, [usuarios]);

  async function toggleUsuarioStatus(userId: string, accion: 'bloquear' | 'activar' | 'verificar') {
    setAccionLoading(userId);
    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const messages = {
        activar: 'Usuario activado correctamente',
        bloquear: 'Usuario bloqueado correctamente',
        verificar: 'Email verificado correctamente'
      };
      
      showToast(messages[accion], 'success');
      onRefresh();
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al actualizar usuario',
        'error'
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* 🔍 BARRA DE BÚSQUEDA */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador principal */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtro por Rol */}
            <div className="md:w-48">
              <select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">🎯 Todos los roles</option>
                {rolesUnicos.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="md:w-48">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📊 Todos los estados</option>
                <option value="ACTIVO">🟢 Activos</option>
                <option value="BLOQUEADO">🔴 Bloqueados</option>
              </select>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
              {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>

          {/* Tags de filtros activos */}
          {(searchTerm || filterRol !== "TODOS" || filterEstado !== "TODOS") && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                <span>🔍 “{searchTerm}”</span>
                  <button onClick={() => setSearchTerm("")} className="hover:text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterRol !== "TODOS" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <span>🎯 {filterRol}</span>
                  <button onClick={() => setFilterRol("TODOS")} className="hover:text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterEstado !== "TODOS" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <span>{filterEstado === "ACTIVO" ? "🟢 Activos" : "🔴 Bloqueados"}</span>
                  <button onClick={() => setFilterEstado("TODOS")} className="hover:text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabla de resultados */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Foto</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Nombre Completo</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Rol</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {searchTerm || filterRol !== "TODOS" || filterEstado !== "TODOS" 
                        ? "No se encontraron usuarios con los filtros aplicados"
                        : "No hay usuarios registrados"}
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u, index) => (
                    <tr 
                      key={u.id} 
                      className={`
                        border-t transition-colors
                        ${u.bloqueado ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <td className="p-4 text-gray-500 font-mono text-sm">
                        {index + 1}
                      </td>
                      
                      <td className="p-4">
                        {u.foto_url ? (
<img 
  src={u.foto_url}
  alt={`${u.nombre} ${u.apellido}`}
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
/>
                        ) : (
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium
                            ${getAvatarColor(u.nombre)}
                          `}>
                            {getInitials(u.nombre, u.apellido)}
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-medium">
                        <div className={u.bloqueado ? 'text-red-700' : 'text-gray-900'}>
                          {`${u.nombre} ${u.apellido}`}
                        </div>
                        {u.telefono && (
                          <div className={`text-xs ${u.bloqueado ? 'text-red-500' : 'text-gray-500'}`}>
                            {u.telefono}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className={u.bloqueado ? 'text-red-600' : 'text-gray-600'}>
                          {u.email}
                        </div>
                        <div className="text-xs mt-1">
                          {u.email_verificado ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <span>✅</span> Verificado
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <span>⏳</span> No verificado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium border
                          ${getRolBadgeClass(u.rol_nombre)}
                        `}>
                          {u.rol_nombre}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.bloqueado ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              Bloqueado
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Activo
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Botón Activar/Bloquear */}
                          {u.bloqueado ? (
                            <button
                              onClick={() => toggleUsuarioStatus(u.id, 'activar')}
                              disabled={accionLoading === u.id}
                              className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 group relative border border-green-200 hover:border-green-300"
                              title="Activar usuario"
                            >
                              {accionLoading === u.id ? (
                                <span className="animate-spin border-2 border-green-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                              ) : (
                                <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleUsuarioStatus(u.id, 'bloquear')}
                              disabled={accionLoading === u.id}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 group relative border border-red-200 hover:border-red-300"
                              title="Bloquear usuario"
                            >
                              {accionLoading === u.id ? (
                                <span className="animate-spin border-2 border-red-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                              ) : (
                                <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Botón Verificar Email */}
                          {!u.email_verificado && (
                            <button
                              onClick={() => toggleUsuarioStatus(u.id, 'verificar')}
                              disabled={accionLoading === u.id}
                              className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 group relative border border-blue-200 hover:border-blue-300"
                              title="Marcar como verificado"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {/* 🖊️ BOTÓN DE EDITAR */}
                          <button
                            onClick={() => onEdit?.(u)}
                            disabled={accionLoading === u.id}
                            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50 group relative border border-amber-200 hover:border-amber-300"
                            title="Editar usuario"
                          >
                            {accionLoading === u.id ? (
                              <span className="animate-spin border-2 border-amber-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                            ) : (
                              <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                          </button>

                          {/* 🔑 Botón de cambiar contraseña */}
<button
  onClick={() => onChangePassword?.(u)}
  disabled={accionLoading === u.id}
  className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50 group relative border border-purple-200 hover:border-purple-300"
  title="Cambiar contraseña"
>
  <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
</button>
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
"use client";

import { useState, useMemo } from "react";
import { ToastContainer, useToast } from "../usuarios/Toast";
import { Moneda, MonedaTableProps } from "@/app/productos/types";

// Función para obtener URL de bandera por código de moneda (OPCIÓN 1)
const getFlagUrl = (codigo: string): string => {
  // Mapeo de códigos de moneda a códigos de país ISO
  const countryCode: Record<string, string> = {
    // Europa
    'EUR': 'eu',      // Unión Europea
    
    // Américas
    'USD': 'us',      // Estados Unidos
    'CAD': 'ca',      // Canadá
    'MXN': 'mx',      // México
    'ARS': 'ar',      // Argentina
    'BRL': 'br',      // Brasil
    'COP': 'co',      // Colombia
    'CLP': 'cl',      // Chile
    'PEN': 'pe',      // Perú
    'UYU': 'uy',      // Uruguay
    'PYG': 'py',      // Paraguay
    'BOB': 'bo',      // Bolivia
    'VES': 've',      // Venezuela
    'CRC': 'cr',      // Costa Rica
    'DOP': 'do',      // República Dominicana
    'GTQ': 'gt',      // Guatemala
    'HNL': 'hn',      // Honduras
    'NIO': 'ni',      // Nicaragua
    'PAB': 'pa',      // Panamá
    'CUP': 'cu',      // Cuba
    
    // Europa (no euro)
    'GBP': 'gb',      // Reino Unido
    'CHF': 'ch',      // Suiza
    'SEK': 'se',      // Suecia
    'NOK': 'no',      // Noruega
    'DKK': 'dk',      // Dinamarca
    'PLN': 'pl',      // Polonia
    'CZK': 'cz',      // República Checa
    'HUF': 'hu',      // Hungría
    'RON': 'ro',      // Rumania
    'BGN': 'bg',      // Bulgaria
    'HRK': 'hr',      // Croacia
    'RSD': 'rs',      // Serbia
    'ISK': 'is',      // Islandia
    
    // Asia
    'JPY': 'jp',      // Japón
    'CNY': 'cn',      // China
    'KRW': 'kr',      // Corea del Sur
    'INR': 'in',      // India
    'RUB': 'ru',      // Rusia
    'TRY': 'tr',      // Turquía
    'ILS': 'il',      // Israel
    'SAR': 'sa',      // Arabia Saudita
    'AED': 'ae',      // Emiratos Árabes
    'THB': 'th',      // Tailandia
    'SGD': 'sg',      // Singapur
    'MYR': 'my',      // Malasia
    'IDR': 'id',      // Indonesia
    'PHP': 'ph',      // Filipinas
    'VND': 'vn',      // Vietnam
    'PKR': 'pk',      // Pakistán
    'BDT': 'bd',      // Bangladesh
    
    // Oceanía
    'AUD': 'au',      // Australia
    'NZD': 'nz',      // Nueva Zelanda
    
    // África
    'ZAR': 'za',      // Sudáfrica
    'EGP': 'eg',      // Egipto
    'NGN': 'ng',      // Nigeria
    'MAD': 'ma',      // Marruecos
    'TND': 'tn',      // Túnez
  };
  
  return `https://flagcdn.com/24x18/${countryCode[codigo] || 'eu'}.png`;
};

// Función para obtener bandera emoji como fallback
const getFlagEmoji = (codigo: string): string => {
  const flags: Record<string, string> = {
    'EUR': '🇪🇺',
    'USD': '🇺🇸',
    'GBP': '🇬🇧',
    'ARS': '🇦🇷',
    'BRL': '🇧🇷',
    'MXN': '🇲🇽',
    'CAD': '🇨🇦',
    'COP': '🇨🇴',
    'CLP': '🇨🇱',
    'PEN': '🇵🇪',
    'UYU': '🇺🇾',
    'PYG': '🇵🇾',
    'BOB': '🇧🇴',
    'VES': '🇻🇪',
    'JPY': '🇯🇵',
    'CNY': '🇨🇳',
    'KRW': '🇰🇷',
    'INR': '🇮🇳',
    'RUB': '🇷🇺',
    'TRY': '🇹🇷',
    'CHF': '🇨🇭',
    'SEK': '🇸🇪',
    'NOK': '🇳🇴',
    'DKK': '🇩🇰',
    'AUD': '🇦🇺',
    'NZD': '🇳🇿',
    'ZAR': '🇿🇦',
    'ILS': '🇮🇱',
    'SAR': '🇸🇦',
    'AED': '🇦🇪',
    'SGD': '🇸🇬',
    'THB': '🇹🇭',
  };
  return flags[codigo] || '🏳️';
};

export default function MonedaTable({ 
  monedas, 
  loading, 
  onRefresh, 
  onEdit,
  onToggleStatus 
}: MonedaTableProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBase, setFilterBase] = useState<string>("TODOS");
  const [filterActivo, setFilterActivo] = useState<string>("TODOS");

  // Filtrar monedas
  const filteredMonedas = useMemo(() => {
    return monedas.filter(m => {
      const matchesSearch = searchTerm === "" || 
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.simbolo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBase = filterBase === "TODOS" || 
        (filterBase === "BASE" && m.es_base) ||
        (filterBase === "NO_BASE" && !m.es_base);

      const matchesActivo = filterActivo === "TODOS" || 
        (filterActivo === "ACTIVO" && m.activo) ||
        (filterActivo === "INACTIVO" && !m.activo);

      return matchesSearch && matchesBase && matchesActivo;
    });
  }, [monedas, searchTerm, filterBase, filterActivo]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(value);
  };

  async function toggleMonedaStatus(moneda: Moneda) {
    setAccionLoading(moneda.id);
    try {
      const res = await fetch(`/api/monedas/${moneda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !moneda.activo })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      showToast(
        moneda.activo ? 'Moneda desactivada correctamente' : 'Moneda activada correctamente',
        'success'
      );
      onRefresh();
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al actualizar moneda',
        'error'
      );
    } finally {
      setAccionLoading(null);
    }
  }

  async function setMonedaBase(moneda: Moneda) {
    if (moneda.es_base) {
      showToast('Esta moneda ya es la base', 'info');
      return;
    }

    setAccionLoading(moneda.id);
    try {
      const res = await fetch(`/api/monedas/${moneda.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ es_base: true })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      showToast('Moneda base actualizada correctamente', 'success');
      onRefresh();
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al establecer moneda base',
        'error'
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por código, nombre o símbolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            {/* Filtro por Base */}
            <div className="md:w-44">
              <select
                value={filterBase}
                onChange={(e) => setFilterBase(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">⭐ Todas las monedas</option>
                <option value="BASE">👑 Moneda base</option>
                <option value="NO_BASE">💱 Otras monedas</option>
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="md:w-40">
              <select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📊 Todos los estados</option>
                <option value="ACTIVO">✅ Activas</option>
                <option value="INACTIVO">❌ Inactivas</option>
              </select>
            </div>

            {/* Contador */}
            <div className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">{filteredMonedas.length}</span>
              <span className="text-gray-500 ml-1">monedas</span>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando monedas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Bandera</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Código</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Símbolo</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonedas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No hay monedas registradas
                    </td>
                  </tr>
                ) : (
                  filteredMonedas.map((m, index) => {
                    // Determinar qué mostrar: imagen o emoji
                    const flagUrl = getFlagUrl(m.codigo);
                    
                    return (
                      <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                        <td className="p-4 text-gray-500 font-mono text-sm">
                          {index + 1}
                        </td>
                        
                        {/* Celda de bandera con imagen + fallback a emoji */}
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <img 
                              src={flagUrl}
                              alt={`Bandera ${m.codigo}`}
                              className="w-6 h-4 object-cover rounded shadow-sm"
                              onError={(e) => {
                                // Si la imagen no carga, mostrar emoji en su lugar
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const emojiSpan = document.createElement('span');
                                  emojiSpan.className = 'text-xl';
                                  emojiSpan.innerText = getFlagEmoji(m.codigo);
                                  parent.appendChild(emojiSpan);
                                }
                              }}
                            />
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-mono font-medium text-gray-900">{m.codigo}</span>
                        </td>
                        <td className="p-4 text-gray-900">{m.nombre}</td>
                        <td className="p-4">
                          <span className="text-xl">{m.simbolo}</span>
                        </td>
                        <td className="p-4">
                          {m.es_base ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                              👑 Base
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              💱 Conversión
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {m.activo ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                              Activa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {/* Botón Establecer como Base */}
                            {!m.es_base && m.activo && (
                              <button
                                onClick={() => setMonedaBase(m)}
                                disabled={accionLoading === m.id}
                                className="p-2.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all disabled:opacity-50 group relative border border-yellow-200 hover:border-yellow-300"
                                title="Establecer como moneda base"
                              >
                                {accionLoading === m.id ? (
                                  <span className="animate-spin border-2 border-yellow-600 border-t-transparent rounded-full w-4 h-4 block"></span>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* Botón Activar/Desactivar */}
                            <button
                              onClick={() => toggleMonedaStatus(m)}
                              disabled={accionLoading === m.id || m.es_base}
                              className={`p-2.5 rounded-lg transition-all disabled:opacity-50 group relative border ${
                                m.activo && !m.es_base
                                  ? 'text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300' 
                                  : !m.activo
                                  ? 'text-green-600 hover:bg-green-50 border-green-200 hover:border-green-300'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={
                                m.es_base 
                                  ? 'No se puede desactivar la moneda base' 
                                  : m.activo 
                                  ? 'Desactivar moneda' 
                                  : 'Activar moneda'
                              }
                            >
                              {accionLoading === m.id ? (
                                <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4 block"></span>
                              ) : m.activo && !m.es_base ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : !m.activo ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
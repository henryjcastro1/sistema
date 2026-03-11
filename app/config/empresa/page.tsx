"use client";

import { useState, useEffect, useRef } from "react";
import { ToastContainer, useToast } from "../../components/usuarios/Toast";
import Image from "next/image";

interface EmpresaConfig {
  nombre_empresa: string;
  logo_url?: string;
  color_primario: string;
  color_secundario: string;
  email_contacto?: string;
  telefono?: string;
  direccion?: string;
}

export default function ConfigEmpresaPage() {
  const [config, setConfig] = useState<EmpresaConfig>({
    nombre_empresa: 'HelpDesk',
    color_primario: '#2563eb',
    color_secundario: '#1e40af'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/config/empresas", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('El archivo debe ser una imagen', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no debe superar los 2MB', 'error');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nombre_empresa', config.nombre_empresa);
      formData.append('color_primario', config.color_primario);
      formData.append('color_secundario', config.color_secundario);
      if (config.email_contacto) formData.append('email_contacto', config.email_contacto);
      if (config.telefono) formData.append('telefono', config.telefono);
      if (config.direccion) formData.append('direccion', config.direccion);
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch('/api/config/empresas', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al guardar configuración');

      showToast('✅ Configuración guardada correctamente', 'success');
      cargarConfiguracion();
    } catch (error) {
      showToast('Error al guardar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración de Empresa</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Logo de la Empresa</h2>
          
          <div className="flex items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Sin logo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Seleccionar Logo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">
                Formatos permitidos: JPG, PNG, GIF, SVG<br />
                Tamaño máximo: 2MB
              </p>
              {logoFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Logo seleccionado: {logoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información básica */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de la Empresa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={config.nombre_empresa}
                onChange={(e) => setConfig({...config, nombre_empresa: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Contacto
              </label>
              <input
                type="email"
                value={config.email_contacto || ''}
                onChange={(e) => setConfig({...config, email_contacto: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={config.telefono || ''}
                onChange={(e) => setConfig({...config, telefono: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                value={config.direccion || ''}
                onChange={(e) => setConfig({...config, direccion: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Colores de la marca */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Colores de la Marca</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Primario
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={config.color_primario}
                  onChange={(e) => setConfig({...config, color_primario: e.target.value})}
                  className="w-12 h-10 p-1 border border-gray-200 rounded"
                />
                <input
                  type="text"
                  value={config.color_primario}
                  onChange={(e) => setConfig({...config, color_primario: e.target.value})}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Secundario
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={config.color_secundario}
                  onChange={(e) => setConfig({...config, color_secundario: e.target.value})}
                  className="w-12 h-10 p-1 border border-gray-200 rounded"
                />
                <input
                  type="text"
                  value={config.color_secundario}
                  onChange={(e) => setConfig({...config, color_secundario: e.target.value})}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#1e40af"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => cargarConfiguracion()}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
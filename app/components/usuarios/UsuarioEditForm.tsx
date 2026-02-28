"use client";

import { useState, useEffect, useRef } from "react";
import { UsuarioEditData, UsuarioEditFormProps } from "./types";

const ROLES = [
  { nombre: "ADMIN", label: "Administrador" },
  { nombre: "TECNICO", label: "Técnico" },
  { nombre: "CLIENTE", label: "Cliente" },
];

export default function UsuarioEditForm({ isOpen, onClose, onSubmit, usuario, loading }: UsuarioEditFormProps) {
  const [form, setForm] = useState<Partial<UsuarioEditData>>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol_nombre: "CLIENTE",
    foto_url: "",
  });
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (usuario && isOpen) {
      setForm({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || "",
        rol_nombre: usuario.rol_nombre,
        foto_url: usuario.foto_url || "",
      });
      setPreviewImage(usuario.foto_url || null);
    }
  }, [usuario, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setForm({ ...form, foto_url: base64 });
      setError("");
    } catch (err) {
      console.error("❌ Error procesando imagen:", err);
      setError("Error procesando la imagen");
      setPreviewImage(usuario?.foto_url || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.apellido || !form.email) {
      setError("Nombre, apellido y email son obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Email inválido");
      return;
    }

    if (!usuario?.id) {
      setError("Error: ID de usuario no válido");
      return;
    }

    try {
      await onSubmit(usuario.id, form);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al actualizar usuario");
      }
    }
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Usuario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {previewImage ? (
                <div className="relative group">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setForm({ ...form, foto_url: "" });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-6 h-6"></span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()} 
                  className={`w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-2xl text-gray-400">+</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
              disabled={uploading}
            />
            <p className="text-xs text-gray-500">
              {uploading ? 'Procesando imagen...' : 'Click para cambiar foto (máx. 2MB)'}
            </p>
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Nombre" 
              className="w-full p-3 border rounded-lg" 
              value={form.nombre} 
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
              required 
            />
            <input 
              placeholder="Apellido" 
              className="w-full p-3 border rounded-lg" 
              value={form.apellido} 
              onChange={(e) => setForm({ ...form, apellido: e.target.value })} 
              required 
            />
          </div>

          {/* Email */}
          <input 
            placeholder="Email" 
            type="email" 
            className="w-full p-3 border rounded-lg" 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            required 
          />
          
          {/* Teléfono */}
          <input 
            placeholder="Teléfono (opcional)" 
            className="w-full p-3 border rounded-lg" 
            value={form.telefono} 
            onChange={(e) => setForm({ ...form, telefono: e.target.value })} 
          />
          
          {/* Rol */}
          <select 
            className="w-full p-3 border rounded-lg" 
            value={form.rol_nombre} 
            onChange={(e) => setForm({ ...form, rol_nombre: e.target.value })}
          >
            {ROLES.map((rol) => (
              <option key={rol.nombre} value={rol.nombre}>{rol.label}</option>
            ))}
          </select>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || uploading} 
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : uploading ? 'Procesando imagen...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
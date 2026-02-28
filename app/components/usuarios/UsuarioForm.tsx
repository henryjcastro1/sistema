"use client";

import { useState, useRef } from "react";
import { UsuarioFormData, UsuarioFormProps } from "./types";

const ROLES = [
  { nombre: "ADMIN", label: "Administrador" },
  { nombre: "TECNICO", label: "Técnico" },
  { nombre: "CLIENTE", label: "Cliente" },
];

export default function UsuarioForm({ isOpen, onClose, onSubmit, loading }: UsuarioFormProps) {
  const [form, setForm] = useState<UsuarioFormData>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    rol_nombre: "CLIENTE",
    foto_url: "",
  });
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 Estado para mostrar/ocultar password
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Convertir a Base64 para enviar
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      console.log("📸 Imagen convertida a Base64 (primeros 100 chars):", base64.substring(0, 100) + "...");
      console.log("📏 Longitud total:", base64.length);
      
      // Guardar el Base64 directamente en el formulario
      setForm({ ...form, foto_url: base64 });
      setError("");
      
    } catch (err) {
      console.error("❌ Error procesando imagen:", err);
      setError("Error procesando la imagen");
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setError("Nombre, apellido, email y password son obligatorios");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Email inválido");
      return;
    }

    try {
      console.log("📤 Enviando formulario con foto:", form.foto_url ? "SÍ" : "NO");
      await onSubmit(form);
      
      // Resetear formulario
      setForm({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        telefono: "",
        rol_nombre: "CLIENTE",
        foto_url: "",
      });
      setPreviewImage(null);
      setError("");
      onClose();
    } catch (err) {
      console.error("❌ Error en submit:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al crear usuario");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crear Nuevo Usuario</h2>
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
              {uploading ? 'Procesando imagen...' : 'Click para subir foto (máx. 2MB)'}
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
          
          {/* 👁️ Password con ojo */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password (mínimo 6 caracteres)" 
              className="w-full p-3 border rounded-lg pr-12" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required 
              minLength={6} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>

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
              {loading ? 'Creando...' : uploading ? 'Procesando imagen...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
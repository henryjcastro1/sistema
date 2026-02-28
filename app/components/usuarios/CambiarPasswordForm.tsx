"use client";

import { useState } from "react";
import { CambiarPasswordData, CambiarPasswordFormProps } from "./types";

export default function CambiarPasswordForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  usuario, 
  loading 
}: CambiarPasswordFormProps) {
  
  const [form, setForm] = useState<CambiarPasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!usuario?.id) {
      setError("Error: Usuario no válido");
      return;
    }

    try {
      await onSubmit(usuario.id, form);
      // Resetear formulario
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError("");
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al cambiar contraseña");
      }
    }
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Cambiar Contraseña</h2>
            <p className="text-sm text-gray-500 mt-1">
              Usuario: {usuario.nombre} {usuario.apellido}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Contraseña actual */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type={showCurrent ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full p-3 border rounded-lg pr-12"
              placeholder="Ingresa tu contraseña actual"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
            >
              {showCurrent ? "🙈" : "👁"}
            </button>
          </div>

          {/* Nueva contraseña */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full p-3 border rounded-lg pr-12"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
            >
              {showNew ? "🙈" : "👁"}
            </button>
          </div>

          {/* Confirmar contraseña */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full p-3 border rounded-lg pr-12"
              placeholder="Repite la nueva contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>

          {/* Requisitos de contraseña */}
          <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-700">Requisitos:</p>
            <p className={form.newPassword.length >= 6 ? "text-green-600" : "text-gray-500"}>
              ✓ Mínimo 6 caracteres
            </p>
            <p className={form.newPassword === form.confirmPassword && form.confirmPassword ? "text-green-600" : "text-gray-500"}>
              ✓ Las contraseñas coinciden
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Cambiando..." : "Cambiar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
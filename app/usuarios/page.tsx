"use client";

import { useEffect, useState } from "react";
import {
  Usuario,
  UsuarioFormData,
  UsuarioEditData,
} from "../components/usuarios/types";
import UsuarioTable from "../components/usuarios/UsuarioTable";
import UsuarioForm from "../components/usuarios/UsuarioForm";
import UsuarioEditForm from "../components/usuarios/UsuarioEditForm";
import CambiarPasswordForm from "../components/usuarios/CambiarPasswordForm";

export const dynamic = "force-dynamic";

/* ✅ Tipo explícito para cambio de contraseña */
interface ChangePasswordData {
  currentPassword?: string; // opcional si es admin
  newPassword: string;
  confirmPassword: string;
}

/* ✅ Tipo para respuestas API */
interface ApiResponse {
  message?: string;
  error?: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);
  const [usuarioToChangePassword, setUsuarioToChangePassword] =
    useState<Usuario | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  /* ✅ Carga centralizada (sin duplicación) */
  async function loadUsuarios() {
    try {
      setLoading(true);

      const res = await fetch("/api/usuarios", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const data: Usuario[] = await res.json();
      setUsuarios(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsuarios();
  }, []);

  /* ============================= */
  /* CREAR USUARIO */
  /* ============================= */
  async function handleCreateUser(formData: UsuarioFormData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      await loadUsuarios();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  }

  /* ============================= */
  /* EDITAR USUARIO */
  /* ============================= */
  async function handleEditUser(
    id: string,
    data: Partial<UsuarioEditData>
  ) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar usuario");
      }

      await loadUsuarios();
      setEditModalOpen(false);
      setUsuarioToEdit(null);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  /* ============================= */
  /* CAMBIAR CONTRASEÑA */
  /* ============================= */
  async function handleChangePassword(
    userId: string,
    data: ChangePasswordData
  ) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${userId}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al cambiar contraseña");
      }

      setPasswordModalOpen(false);
      setUsuarioToChangePassword(null);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  const handleEditClick = (usuario: Usuario) => {
    setUsuarioToEdit(usuario);
    setEditModalOpen(true);
  };

  const handleChangePasswordClick = (usuario: Usuario) => {
    setUsuarioToChangePassword(usuario);
    setPasswordModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <UsuarioTable
        usuarios={usuarios}
        loading={loading}
        onRefresh={loadUsuarios}
        onEdit={handleEditClick}
        onChangePassword={handleChangePasswordClick}
      />

      <UsuarioForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateUser}
        loading={formLoading}
      />

      <UsuarioEditForm
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setUsuarioToEdit(null);
        }}
        onSubmit={handleEditUser}
        usuario={usuarioToEdit}
        loading={formLoading}
      />

      <CambiarPasswordForm
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setUsuarioToChangePassword(null);
        }}
        onSubmit={handleChangePassword}
        usuario={usuarioToChangePassword}
        loading={formLoading}
      />
    </div>
  );
}
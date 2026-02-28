export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  foto_url?: string;
  rol_nombre: string;
  email_verificado: boolean;
  bloqueado: boolean;
  created_at: string;
}

export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  rol_nombre: string;
  foto_url?: string;
}

export interface UsuarioEditData {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol_nombre: string;
  foto_url?: string;
}

// 👇 NUEVO: Para cambio de contraseña
export interface CambiarPasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CambiarPasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, data: CambiarPasswordData) => Promise<void>;
  usuario: Usuario | null;
  loading?: boolean;
}

export interface UsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<void>;
  loading?: boolean;
}

export interface UsuarioEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<UsuarioEditData>) => Promise<void>;
  usuario: Usuario | null;
  loading?: boolean;
}

export interface UsuarioTableProps {
  usuarios: Usuario[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (usuario: Usuario) => void;
  onChangePassword?: (usuario: Usuario) => void; // 👈 NUEVO
}
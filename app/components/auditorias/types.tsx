export interface AuditLog {
  id: string;
  created_at: string;
  usuario_email: string | null;
  usuario_nombre: string | null;
  accion: string;
  tabla: string;
  registro_id: string | null;
  datos_antes: any;
  datos_despues: any;
  ip: string;
  user_agent: string;
}

export interface FilterParams {
  fechaInicio?: string;
  fechaFin?: string;
  accion?: string;
  tabla?: string;
  usuario?: string;
  registro_id?: string;
}

export interface AuditTableProps {
  logs: AuditLog[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export interface AuditFiltersProps {
  onFilterChange: (filters: FilterParams) => void;
  loading?: boolean;
}
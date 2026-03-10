export interface Servicio {
  id: string;
  numero_servicio: string;
  titulo: string;
  descripcion?: string;
  estado: 'SOLICITADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  prioridad: 1 | 2 | 3 | 4 | 5;
  direccion?: string;
  
  // Relaciones
  usuario_id: string;
  tecnico_id?: string;
  sla_config_id?: string;
  
  // Económico
  presupuesto?: number;
  costo_final?: number;
  
  // Fechas
  fecha_solicitado: string;
  fecha_asignado?: string;
  fecha_inicio?: string;
  fecha_primera_respuesta?: string;
  fecha_completado?: string;
  fecha_cancelado?: string;
  
  // SLA
  sla_deadline_respuesta?: string;
  sla_deadline_solucion?: string;
  sla_cumple_respuesta?: boolean;
  sla_cumple_solucion?: boolean;
  
  // Evaluación
  calificacion?: number;
  comentario_cliente?: string;
  
  // Datos de joins
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  tecnico_nombre?: string;
  sla_nombre?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface ServicioFormData {
  titulo: string;
  descripcion?: string;
  prioridad: number;
  direccion?: string;
  cliente_id?: string;
}

export interface ServicioTableProps {
  servicios: Servicio[];
  loading: boolean;
  onRefresh: () => void;
  onView?: (servicio: Servicio) => void;
  onEdit?: (servicio: Servicio) => void;
  onAsignar?: (servicio: Servicio) => void;
  onTomar?: (servicio: Servicio) => void;        
  onCompletar?: (servicio: Servicio) => void;    
  onCancelar?: (servicio: Servicio) => void;
  
  esAdmin?: boolean;
  esTecnico?: boolean;
}

export interface ServicioDetalleProps {
  servicio: Servicio | null;
  isOpen: boolean;
  onClose: () => void;
  onAsignar?: (servicio: Servicio) => void;
  onTomar?: (servicio: Servicio) => void;        
  onCompletar?: (servicio: Servicio) => void;
  onCancelar?: (servicio: Servicio) => void;
  esAdmin?: boolean;
  esTecnico?: boolean;
}

export interface ServicioAsignarProps {
  servicio: Servicio | null;
  isOpen: boolean;
  onClose: () => void;
  onAsignar: (servicioId: string, tecnicoId: string) => Promise<void>;
  tecnicos: TecnicoDisponible[];
  loading?: boolean;
}

export interface TecnicoDisponible {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  servicios_activos: number;
  calificacion_promedio?: number;
  disponible: boolean;
}

export interface ServicioStats {
  total: number;
  solicitados: number;
  en_proceso: number;
  completados_hoy: number;
  vencidos: number;
  promedio_calificacion?: number;
}


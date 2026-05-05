// app/servicios/types.ts

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
  categoria_id?: string;  // 👈 NUEVO CAMPO
  
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
  categoria_nombre?: string;  // 👈 NUEVO CAMPO
  categoria_icono?: string;   // 👈 NUEVO CAMPO
  
  created_at: string;
  updated_at?: string;
}

export interface ServicioFormData {
  titulo: string;
  descripcion?: string;
  prioridad: number;
  direccion?: string;
  categoria_id?: string;  // 👈 NUEVO CAMPO
  cliente_id?: string;    // Para admin
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

// 👈 NUEVO: Tipo para categorías de servicios
export interface CategoriaServicio {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
  orden: number;
}

// Configuración visual para las categorías
export const CATEGORIA_CONFIG: Record<string, { icono: string; color: string; bgColor: string }> = {
  'Desarrollo Web': { 
    icono: '🌐', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50' 
  },
  'Desarrollo Software': { 
    icono: '💻', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50' 
  },
  'Desarrollo Apps Móviles': { 
    icono: '📱', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50' 
  },
  'Soporte Técnico': { 
    icono: '🛠️', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50' 
  },
  'Gestión de Redes': { 
    icono: '🔌', 
    color: 'text-cyan-700', 
    bgColor: 'bg-cyan-50' 
  },
  'Ciberseguridad': { 
    icono: '🔒', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50' 
  },
  'Consultoría IT': { 
    icono: '📊', 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-50' 
  },
  'Migración a la Nube': { 
    icono: '☁️', 
    color: 'text-sky-700', 
    bgColor: 'bg-sky-50' 
  },
  'Pruebas de Software': { 
    icono: '🧪', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50' 
  }
};

// Función helper para obtener la configuración de una categoría
export const getCategoriaConfig = (nombre?: string) => {
  if (!nombre) return { icono: '📋', color: 'text-gray-700', bgColor: 'bg-gray-50' };
  return CATEGORIA_CONFIG[nombre] || { icono: '📋', color: 'text-gray-700', bgColor: 'bg-gray-50' };
};
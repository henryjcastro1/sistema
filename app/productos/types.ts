// =====================================================
// TIPOS DE MONEDAS
// =====================================================

export interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa_cambio: number;
  es_base: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonedaFormData {
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa_cambio: number;
  es_base: boolean;
}

export interface MonedaEditData {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa_cambio: number;
  es_base: boolean;
  activo: boolean;
}

export interface MonedaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MonedaFormData) => Promise<void>;
  loading?: boolean;
}

export interface MonedaEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<MonedaEditData>) => Promise<void>;
  moneda: Moneda | null;
  loading?: boolean;
}

export interface MonedaTableProps {
  monedas: Moneda[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (moneda: Moneda) => void;
  onToggleStatus?: (moneda: Moneda) => void;
}

// =====================================================
// TIPOS DE CATEGORÍAS Y SUBCATEGORÍAS
// =====================================================

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activo: boolean;
  orden: number;
}

export interface Subcategoria {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activo: boolean;
  orden: number;
}

// =====================================================
// TIPOS DE PRODUCTOS
// =====================================================

export interface PrecioHistorico {
  precio: number;
  moneda_id: string;
  fecha: string;
}

export interface Dimensiones {
  largo: number;
  ancho: number;
  alto: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  moneda_id?: string;
  moneda_codigo?: string;
  moneda_simbolo?: string;
  precio_usd?: number;
  precio_eur?: number;
  stock: number;
  imagen_url?: string;
  activo: boolean;
  destacado?: boolean;
  categoria_id?: string;
  categoria_nombre?: string;
  subcategoria_id?: string;
  subcategoria_nombre?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: Dimensiones;
  precios_historicos?: PrecioHistorico[];
  created_at: string;
}

export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  moneda_id?: string;
  stock: number;
  imagen_url?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: Dimensiones;
  destacado?: boolean;
}

export interface ProductoEditData {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: Dimensiones;
  destacado?: boolean;
}

export interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductoFormData) => Promise<void>;
  loading?: boolean;
  categorias?: Categoria[];
  monedas?: Moneda[];
}

export interface ProductoEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<ProductoEditData>) => Promise<void>;
  producto: Producto | null;
  loading?: boolean;
  categorias?: Categoria[];
  monedas?: Moneda[];
}

export interface ProductoTableProps {
  productos: Producto[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  categorias?: Categoria[];
  monedas?: Moneda[];
}

// =====================================================
// TIPOS DE AUDITORÍA
// =====================================================

export interface AuditLog {
  id: string;
  created_at: string;
  usuario_email: string | null;
  usuario_nombre: string | null;
  accion: string;
  tabla: string;
  registro_id: string | null;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  ip: string;
  user_agent: string;
}

export interface FilterParams {
  fechaInicio?: string;
  fechaFin?: string;
  accion?: string;
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
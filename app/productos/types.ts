// =====================================================
// TIPOS DE PRODUCTOS ACTUALIZADOS
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

// 🔥 NUEVO: Tipo para imágenes adicionales
export interface ProductoImagen {
  id: number;
  imagen_url: string;
  orden: number;
  es_principal: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// 🔥 ACTUALIZADO: Producto con múltiples imágenes
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
  imagen_url?: string;  // Imagen principal
  imagenes_adicionales?: ProductoImagen[];  // 🔥 NUEVO: Array de imágenes adicionales
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
  updated_at?: string;
}

// 🔥 ACTUALIZADO: Formulario para crear producto (imagenes_adicionales SIEMPRE es array)
export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  moneda_id?: string;
  stock: number;
  imagen_url: File | string | null;  
  imagenes_adicionales: File[];  // ✅ CAMBIADO: Siempre array, no puede ser undefined
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

// 🔥 ACTUALIZADO: Datos para editar producto
export interface ProductoEditData {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  imagenes_adicionales: File[];  // ✅ Siempre array
  imagenes_eliminar?: number[];
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

// 🔥 ACTUALIZADO: Props del formulario de creación
export interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductoFormData) => Promise<void>;
  loading?: boolean;
  categorias?: Categoria[];
  subcategorias?: Subcategoria[];
  monedas?: Moneda[];
}

// 🔥 ACTUALIZADO: Props del formulario de edición
export interface ProductoEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<ProductoEditData> | FormData) => Promise<void>;
  producto: Producto | null;
  loading?: boolean;
  categorias?: Categoria[];
  monedas?: Moneda[];
}

// 🔥 ACTUALIZADO: Props de la tabla de productos
export interface ProductoTableProps {
  productos: Producto[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  onDeleteImage?: (productoId: string, imagenId: number) => Promise<void>;
  categorias?: Categoria[];
  subcategorias?: Subcategoria[];
  monedas?: Moneda[];
}

// =====================================================
// TIPOS ADICIONALES PARA LA GALERÍA DE IMÁGENES
// =====================================================

export interface GaleriaImagenesProps {
  imagenes: ProductoImagen[];
  imagenPrincipal?: string;
  onSetPrincipal?: (imagenId: number) => Promise<void>;
  onDeleteImage?: (imagenId: number) => Promise<void>;
  onReorder?: (imagenes: ProductoImagen[]) => Promise<void>;
  loading?: boolean;
}

export interface CarruselImagenesProps {
  imagenes: string[];
  autoPlay?: boolean;
  interval?: number;
  showThumbnails?: boolean;
}

export interface SelectorImagenesProps {
  imagenes: File[];
  onAddImagenes: (files: File[]) => void;
  onRemoveImagen: (index: number) => void;
  maxImagenes?: number;
  loading?: boolean;
}

// =====================================================
// UTILIDADES PARA PRODUCTOS
// =====================================================

export function obtenerTodasLasImagenes(producto: Producto): string[] {
  const urls: string[] = [];
  
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    urls.push(producto.imagen_url);
  }
  
  if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
    for (const img of producto.imagenes_adicionales) {
      if (img.imagen_url && img.imagen_url.trim() !== '') {
        urls.push(img.imagen_url);
      }
    }
  }
  
  return urls;
}

export function obtenerPrimeraImagen(producto: Producto): string {
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    return producto.imagen_url;
  }
  
  if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
    const principal = producto.imagenes_adicionales.find(img => img.es_principal);
    if (principal) return principal.imagen_url;
    return producto.imagenes_adicionales[0].imagen_url;
  }
  
  return '';
}

export function obtenerImagenesOrdenadas(producto: Producto): ProductoImagen[] {
  if (!producto.imagenes_adicionales) return [];
  return [...producto.imagenes_adicionales].sort((a, b) => a.orden - b.orden);
}

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
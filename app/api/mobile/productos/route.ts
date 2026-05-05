// app/api/mobile/productos/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { Dimensiones } from "@/app/productos/types";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

// 🔥 Definir el tipo para las imágenes adicionales
interface ProductoImagen {
  id: number;
  imagen_url: string;
  orden: number;
  es_principal: boolean;
}

// 🔥 Definir el tipo para el producto
interface ProductoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_usd: number | null;
  precio_eur: number | null;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  destacado: boolean;
  marca: string | null;
  modelo: string | null;
  sku: string | null;
  codigo_barras: string | null;
  garantia_meses: number | null;
  peso_kg: number | null;
  dimensiones: Dimensiones | null;  // ✅ Corregido: ya no es any
  categoria_id: string | null;
  categoria_nombre: string | null;
  subcategoria_id: string | null;
  subcategoria_nombre: string | null;
  created_at: string;
  updated_at: string;
  imagenes_adicionales: ProductoImagen[] | null;
}

export async function GET(req: Request) {
  try {
    // Verificar token (opcional - los productos pueden ser públicos)
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        userId = decoded.id;
      } catch (error) {
        // Token inválido, pero continuamos sin usuario
      }
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const busqueda = searchParams.get('busqueda');
    const destacados = searchParams.get('destacados') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Consulta mejorada con imágenes adicionales
    let query = `
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.precio_usd,
        p.precio_eur,
        p.stock,
        p.imagen_url,
        p.activo,
        p.destacado,
        p.marca,
        p.modelo,
        p.sku,
        p.codigo_barras,
        p.garantia_meses,
        p.peso_kg,
        p.dimensiones,
        c.id as categoria_id,
        c.nombre as categoria_nombre,
        sc.id as subcategoria_id,
        sc.nombre as subcategoria_nombre,
        p.created_at,
        p.updated_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'imagen_url', pi.imagen_url,
              'orden', pi.orden,
              'es_principal', pi.es_principal
            ) ORDER BY pi.orden
          )
          FROM productos_imagenes pi 
          WHERE pi.producto_id = p.id 
            AND pi.activo = true 
            AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id AND sc.deleted_at IS NULL
      WHERE p.deleted_at IS NULL AND p.activo = true
    `;

    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (categoria) {
      query += ` AND p.categoria_id = $${paramIndex}`;
      values.push(categoria);
      paramIndex++;
    }

    if (busqueda) {
      query += ` AND (p.nombre ILIKE $${paramIndex} OR p.descripcion ILIKE $${paramIndex} OR p.marca ILIKE $${paramIndex})`;
      values.push(`%${busqueda}%`);
      paramIndex++;
    }

    if (destacados) {
      query += ` AND p.destacado = true`;
    }

    query += ` ORDER BY p.destacado DESC, p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Obtener total para paginación
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM productos p
      WHERE p.deleted_at IS NULL AND p.activo = true
    `;
    
    const countValues: (string | number)[] = [];
    let countIndex = 1;
    
    if (categoria) {
      countQuery += ` AND p.categoria_id = $${countIndex}`;
      countValues.push(categoria);
      countIndex++;
    }
    
    if (busqueda) {
      countQuery += ` AND (p.nombre ILIKE $${countIndex} OR p.descripcion ILIKE $${countIndex} OR p.marca ILIKE $${countIndex})`;
      countValues.push(`%${busqueda}%`);
      countIndex++;
    }
    
    if (destacados) {
      countQuery += ` AND p.destacado = true`;
    }
    
    const countResult = await pool.query(countQuery, countValues);

    // Función para construir URL completa de imágenes
const getFullImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path; // ✅ usar directamente
};

    // 🔥 CORREGIDO: Sin usar 'any' - tipado explícito
    const productosConImagenes = result.rows.map((producto: ProductoRow) => {
      // Procesar imágenes adicionales con tipado seguro
      let imagenesProcesadas: ProductoImagen[] = [];
      
      if (producto.imagenes_adicionales && Array.isArray(producto.imagenes_adicionales)) {
        imagenesProcesadas = producto.imagenes_adicionales.map((img: ProductoImagen) => ({
          ...img,
          imagen_url: getFullImageUrl(img.imagen_url) || ''
        }));
      }

      return {
        ...producto,
        imagen_url: getFullImageUrl(producto.imagen_url),
        imagenes_adicionales: imagenesProcesadas
      };
    });

    return NextResponse.json({
      success: true,
      productos: productosConImagenes,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error("Error GET productos móvil:", error);
    return NextResponse.json(
      { error: "Error obteniendo productos" },
      { status: 500 }
    );
  }
}
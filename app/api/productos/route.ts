import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface ProductoInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagen_url?: string;  // ✅ Ahora puede ser Base64
  categoria_id?: string;
  subcategoria_id?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: {
    largo: number;
    ancho: number;
    alto: number;
  };
  destacado?: boolean;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
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
        p.categoria_id,
        p.subcategoria_id,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre,
        p.created_at,
        p.updated_at
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id AND sc.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET productos:", error);
    return NextResponse.json(
      { error: "Error obteniendo productos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: ProductoInput = await req.json();

    const { 
      nombre, 
      descripcion, 
      precio, 
      stock, 
      imagen_url,
      categoria_id,
      subcategoria_id,
      sku,
      codigo_barras,
      marca,
      modelo,
      garantia_meses,
      peso_kg,
      dimensiones,
      destacado
    } = body;

    // Validaciones básicas
    if (!nombre || precio === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Nombre, precio y stock son obligatorios" },
        { status: 400 }
      );
    }

    if (precio < 0) {
      return NextResponse.json(
        { error: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: "El stock no puede ser negativo" },
        { status: 400 }
      );
    }

    // Validar SKU único si se proporciona
    if (sku) {
      const skuExists = await pool.query(
        `SELECT id FROM productos WHERE sku = $1 AND deleted_at IS NULL`,
        [sku]
      );
      if (skuExists.rows.length > 0) {
        return NextResponse.json(
          { error: "El SKU ya está registrado" },
          { status: 409 }
        );
      }
    }

    // Si la imagen es Base64, verificar que no sea demasiado grande
    if (imagen_url && imagen_url.startsWith('data:image')) {
      // Estimar tamaño en MB (aproximado)
      const base64Length = imagen_url.length;
      const sizeInMB = (base64Length * 0.75) / (1024 * 1024); // Aproximación
      
      if (sizeInMB > 5) {
        return NextResponse.json(
          { error: "La imagen es demasiado grande. Máximo 5MB después de codificar." },
          { status: 400 }
        );
      }
    }

    // Insertar producto con todos los campos
    const result = await pool.query(
      `INSERT INTO productos (
        nombre, descripcion, precio, stock, imagen_url,
        categoria_id, subcategoria_id, sku, codigo_barras,
        marca, modelo, garantia_meses, peso_kg, dimensiones, destacado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        nombre,
        descripcion || null,
        precio,
        stock,
        imagen_url || null,  // ✅ Se guarda el Base64 directamente
        categoria_id || null,
        subcategoria_id || null,
        sku || null,
        codigo_barras || null,
        marca || null,
        modelo || null,
        garantia_meses || null,
        peso_kg || null,
        dimensiones || null,
        destacado || false
      ]
    );


    const newProducto = result.rows[0];

    // Obtener quién creó el producto
    const cookieHeader = req.headers.get('cookie');
    let usuarioCreadorId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioCreadorId = decoded.id;
        } catch (e) {
          console.log("Token inválido al crear producto");
        }
      }
    }

    // Obtener IP y User-Agent
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    const userAgent = req.headers.get('user-agent') || '';

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_despues, ip, user_agent)
       VALUES ($1, 'CREAR', 'productos', $2, $3::jsonb, $4::inet, $5)`,
      [
        usuarioCreadorId,
        newProducto.id,
        JSON.stringify(newProducto),
        ip,
        userAgent
      ]
    );

    // Obtener el producto con nombres de categoría para la respuesta
    const productoCompleto = await pool.query(`
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id
      WHERE p.id = $1
    `, [newProducto.id]);

    return NextResponse.json({
      success: true,
      message: "Producto creado exitosamente",
      producto: productoCompleto.rows[0]
    });

  } catch (error) {
    console.error("Error POST productos:", error);
    
    // Error de SKU duplicado
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "El SKU ya está registrado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 }
    );
  }
}
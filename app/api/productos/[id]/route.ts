// app/api/productos/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

interface ProductoUpdateInput {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagen_url?: string | File;
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
  activo?: boolean;
  imagenes_eliminar?: number[];
}

interface Dimensiones {
  largo: number;
  ancho: number;
  alto: number;
}

// Función para guardar imagen
async function guardarImagen(data: File | string, nombre: string, index: number): Promise<string | null> {
  try {
    let buffer: Buffer;
    let extension: string;

    if (data instanceof File) {
      extension = data.name.split('.').pop() || 'jpg';
      const bytes = await data.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (typeof data === 'string' && data.startsWith('data:image')) {
      const matches = data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return null;
      extension = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('/uploads'))) {
      return data;
    } else {
      return null;
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${nombre}_${timestamp}_${random}.${extension}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error("❌ Error guardando imagen:", error);
    return null;
  }
}

// GET /api/productos/[id] - Obtener un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
          WHERE pi.producto_id = p.id AND pi.activo = true AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id AND sc.deleted_at IS NULL
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET producto por ID:", error);
    return NextResponse.json(
      { error: "Error obteniendo producto" },
      { status: 500 }
    );
  }
}

// PUT /api/productos/[id] - Actualizar producto completo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';
    
    let nombre: string | undefined;
    let descripcion: string | undefined;
    let precio: number | undefined;
    let stock: number | undefined;
    let categoria_id: string | undefined;
    let subcategoria_id: string | undefined;
    let sku: string | undefined;
    let codigo_barras: string | undefined;
    let marca: string | undefined;
    let modelo: string | undefined;
    let garantia_meses: number | undefined;
    let peso_kg: number | undefined;
    let dimensiones: Dimensiones | undefined;
    let destacado: boolean | undefined;
    let nuevaImagenPrincipal: File | null = null;
    const nuevasImagenes: File[] = [];
    let imagenesEliminar: number[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      nombre = formData.get('nombre') as string;
      descripcion = formData.get('descripcion') as string;
      precio = parseFloat(formData.get('precio') as string);
      stock = parseInt(formData.get('stock') as string);
      categoria_id = formData.get('categoria_id') as string;
      subcategoria_id = formData.get('subcategoria_id') as string;
      sku = formData.get('sku') as string;
      codigo_barras = formData.get('codigo_barras') as string;
      marca = formData.get('marca') as string;
      modelo = formData.get('modelo') as string;
      garantia_meses = parseInt(formData.get('garantia_meses') as string);
      peso_kg = parseFloat(formData.get('peso_kg') as string);
      destacado = formData.get('destacado') === 'true';
      
      // Dimensiones
      const largo = parseFloat(formData.get('dimensiones_largo') as string);
      const ancho = parseFloat(formData.get('dimensiones_ancho') as string);
      const alto = parseFloat(formData.get('dimensiones_alto') as string);
      if (!isNaN(largo) || !isNaN(ancho) || !isNaN(alto)) {
        dimensiones = { largo: largo || 0, ancho: ancho || 0, alto: alto || 0 };
      }
      
      // Imagen principal
      const imagenPrincipal = formData.get('imagen_url');
      if (imagenPrincipal && imagenPrincipal instanceof File && imagenPrincipal.size > 0) {
        nuevaImagenPrincipal = imagenPrincipal;
      }
      
      // Imágenes adicionales
      const imagenes = formData.getAll('imagenes_adicionales');
      for (const img of imagenes) {
        if (img instanceof File && img.size > 0) {
          nuevasImagenes.push(img);
        }
      }
      
      // IDs de imágenes a eliminar
      const eliminar = formData.getAll('eliminar_imagenes');
      for (const elim of eliminar) {
        if (typeof elim === 'string' && elim) {
          imagenesEliminar.push(parseInt(elim));
        }
      }
    } else {
      const body = await request.json();
      nombre = body.nombre;
      descripcion = body.descripcion;
      precio = body.precio;
      stock = body.stock;
      categoria_id = body.categoria_id;
      subcategoria_id = body.subcategoria_id;
      sku = body.sku;
      codigo_barras = body.codigo_barras;
      marca = body.marca;
      modelo = body.modelo;
      garantia_meses = body.garantia_meses;
      peso_kg = body.peso_kg;
      dimensiones = body.dimensiones;
      destacado = body.destacado;
      imagenesEliminar = body.imagenes_eliminar || [];
    }

    // Verificar que el producto existe
    const existe = await client.query(
      `SELECT * FROM productos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const productoAntes = existe.rows[0];

    // Validar SKU único
    if (sku && sku !== productoAntes.sku) {
      const skuExists = await client.query(
        `SELECT id FROM productos WHERE sku = $1 AND id != $2 AND deleted_at IS NULL`,
        [sku, id]
      );
      if (skuExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "El SKU ya está registrado por otro producto" },
          { status: 409 }
        );
      }
    }

    // Procesar nueva imagen principal
    let imagenPrincipalPath: string | null = productoAntes.imagen_url;
    if (nuevaImagenPrincipal) {
      imagenPrincipalPath = await guardarImagen(nuevaImagenPrincipal, `producto_principal`, 0);
      console.log("✅ Nueva imagen principal guardada:", imagenPrincipalPath);
    }

    // Actualizar producto
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramIndex++}`);
      values.push(precio);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramIndex++}`);
      values.push(stock);
    }
    if (imagenPrincipalPath !== undefined) {
      updates.push(`imagen_url = $${paramIndex++}`);
      values.push(imagenPrincipalPath);
    }
    if (categoria_id !== undefined) {
      updates.push(`categoria_id = $${paramIndex++}`);
      values.push(categoria_id);
    }
    if (subcategoria_id !== undefined) {
      updates.push(`subcategoria_id = $${paramIndex++}`);
      values.push(subcategoria_id);
    }
    if (sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(sku);
    }
    if (codigo_barras !== undefined) {
      updates.push(`codigo_barras = $${paramIndex++}`);
      values.push(codigo_barras);
    }
    if (marca !== undefined) {
      updates.push(`marca = $${paramIndex++}`);
      values.push(marca);
    }
    if (modelo !== undefined) {
      updates.push(`modelo = $${paramIndex++}`);
      values.push(modelo);
    }
    if (garantia_meses !== undefined) {
      updates.push(`garantia_meses = $${paramIndex++}`);
      values.push(garantia_meses);
    }
    if (peso_kg !== undefined) {
      updates.push(`peso_kg = $${paramIndex++}`);
      values.push(peso_kg);
    }
    if (dimensiones !== undefined) {
      updates.push(`dimensiones = $${paramIndex++}`);
      values.push(JSON.stringify(dimensiones));
    }
    if (destacado !== undefined) {
      updates.push(`destacado = $${paramIndex++}`);
      values.push(destacado);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 0) {
      values.push(id);
      const query = `
        UPDATE productos 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;
      
      await client.query(query, values);
    }

    // Eliminar imágenes marcadas
    if (imagenesEliminar.length > 0) {
      // Obtener las rutas de las imágenes a eliminar
      const imagenesAEliminar = await client.query(
        `SELECT imagen_url FROM productos_imagenes WHERE id = ANY($1::int[]) AND producto_id = $2`,
        [imagenesEliminar, id]
      );
      
      // Eliminar archivos físicos
      for (const img of imagenesAEliminar.rows) {
        try {
          const imagePath = join(process.cwd(), 'public', img.imagen_url);
          if (existsSync(imagePath)) {
            await unlink(imagePath);
            console.log("🗑️ Imagen eliminada:", img.imagen_url);
          }
        } catch (err) {
          console.error("⚠️ Error eliminando imagen:", err);
        }
      }
      
      // Soft delete en BD
      await client.query(
        `UPDATE productos_imagenes 
         SET deleted_at = NOW(), activo = false 
         WHERE id = ANY($1::int[]) AND producto_id = $2`,
        [imagenesEliminar, id]
      );
    }

    // Agregar nuevas imágenes adicionales
    if (nuevasImagenes.length > 0) {
      // Obtener el orden actual máximo
      const ordenActual = await client.query(
        `SELECT COALESCE(MAX(orden), -1) as max_orden 
         FROM productos_imagenes 
         WHERE producto_id = $1 AND deleted_at IS NULL`,
        [id]
      );
      const startOrden = (ordenActual.rows[0].max_orden || -1) + 1;
      
      for (let i = 0; i < nuevasImagenes.length; i++) {
        const imagen = nuevasImagenes[i];
        const imagenPath = await guardarImagen(imagen, `producto_${id}`, startOrden + i);
        
        if (imagenPath) {
          await client.query(
            `INSERT INTO productos_imagenes (producto_id, imagen_url, orden, activo)
             VALUES ($1, $2, $3, true)`,
            [id, imagenPath, startOrden + i]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Obtener producto actualizado
    const productoCompleto = await client.query(`
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre,
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
          WHERE pi.producto_id = p.id AND pi.activo = true AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id
      WHERE p.id = $1
    `, [id]);

    // Registrar en auditoría (opcional)
    
    return NextResponse.json({
      success: true,
      message: "Producto actualizado correctamente",
      producto: productoCompleto.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error PUT producto:", error);
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PATCH /api/productos/[id] - Actualización parcial
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { activo } = await request.json();

    if (activo === undefined) {
      return NextResponse.json(
        { error: "El campo activo es requerido" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE productos 
       SET activo = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [activo, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: activo ? "Producto activado" : "Producto desactivado",
      producto: result.rows[0]
    });

  } catch (error) {
    console.error("Error PATCH producto:", error);
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/productos/[id] - Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `UPDATE productos 
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente"
    });

  } catch (error) {
    console.error("Error DELETE producto:", error);
    return NextResponse.json(
      { error: "Error eliminando producto" },
      { status: 500 }
    );
  }
}
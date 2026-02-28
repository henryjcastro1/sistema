import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface ProductoUpdateInput {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagen_url?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: any;
  destacado?: boolean;
  activo?: boolean;
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
        p.updated_at
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
  try {
    const { id } = await params;
    const body: ProductoUpdateInput = await request.json();

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
      destacado,
      activo 
    } = body;

    // Verificar que el producto existe
    const existe = await pool.query(
      `SELECT * FROM productos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const productoAntes = existe.rows[0];

    // Validar SKU único si se está actualizando
    if (sku && sku !== productoAntes.sku) {
      const skuExists = await pool.query(
        `SELECT id FROM productos WHERE sku = $1 AND id != $2 AND deleted_at IS NULL`,
        [sku, id]
      );
      if (skuExists.rows.length > 0) {
        return NextResponse.json(
          { error: "El SKU ya está registrado por otro producto" },
          { status: 409 }
        );
      }
    }

    // Construir consulta dinámica
    const updates: string[] = [];
    const values: any[] = [];
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
      if (precio < 0) {
        return NextResponse.json(
          { error: "El precio no puede ser negativo" },
          { status: 400 }
        );
      }
      updates.push(`precio = $${paramIndex++}`);
      values.push(precio);
    }
    if (stock !== undefined) {
      if (stock < 0) {
        return NextResponse.json(
          { error: "El stock no puede ser negativo" },
          { status: 400 }
        );
      }
      updates.push(`stock = $${paramIndex++}`);
      values.push(stock);
    }
    if (imagen_url !== undefined) {
      updates.push(`imagen_url = $${paramIndex++}`);
      values.push(imagen_url);
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
      values.push(dimensiones);
    }
    if (destacado !== undefined) {
      updates.push(`destacado = $${paramIndex++}`);
      values.push(destacado);
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramIndex++}`);
      values.push(activo);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // Agregar ID al final
    values.push(id);

    const query = `
      UPDATE productos 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const productoDespues = result.rows[0];

    // Obtener quién hizo el cambio
    const cookieHeader = request.headers.get('cookie');
    let usuarioCambioId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioCambioId = decoded.id;
        } catch (e) {}
      }
    }

    // Obtener IP y User-Agent
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip, user_agent)
       VALUES ($1, 'ACTUALIZAR', 'productos', $2, $3::jsonb, $4::jsonb, $5::inet, $6)`,
      [
        usuarioCambioId,
        id,
        JSON.stringify(productoAntes),
        JSON.stringify(productoDespues),
        ip,
        userAgent
      ]
    );

    // Obtener producto con nombres de categoría
    const productoCompleto = await pool.query(`
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre
      FROM productos p
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id
      WHERE p.id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      message: "Producto actualizado correctamente",
      producto: productoCompleto.rows[0]
    });

  } catch (error) {
    console.error("Error PUT producto:", error);
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  }
}

// PATCH /api/productos/[id] - Actualización parcial (para activar/desactivar)
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

    // Verificar que el producto existe
    const existe = await pool.query(
      `SELECT * FROM productos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const productoAntes = existe.rows[0];

    // Actualizar estado
    const result = await pool.query(
      `UPDATE productos 
       SET activo = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [activo, id]
    );

    const productoDespues = result.rows[0];

    // Obtener quién hizo el cambio
    const cookieHeader = request.headers.get('cookie');
    let usuarioCambioId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioCambioId = decoded.id;
        } catch (e) {}
      }
    }

    // Obtener IP y User-Agent
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // ✅ CORREGIDO: Usar parámetros con $1, $2, etc. en lugar de interpolación
    const accionAuditoria = activo ? 'ACTIVAR' : 'DESACTIVAR';
    
    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::inet, $8)`,
      [
        usuarioCambioId,
        accionAuditoria,  // 👈 Pasamos como parámetro, no interpolado
        'productos',
        id,
        JSON.stringify({ activo: productoAntes.activo }),
        JSON.stringify({ activo: productoDespues.activo }),
        ip,
        userAgent
      ]
    );

    return NextResponse.json({
      success: true,
      message: activo ? "Producto activado" : "Producto desactivado",
      producto: productoDespues
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

    // Verificar que el producto existe
    const existe = await pool.query(
      `SELECT * FROM productos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const productoAntes = existe.rows[0];

    // Soft delete
    await pool.query(
      `UPDATE productos 
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    // Obtener quién eliminó
    const cookieHeader = request.headers.get('cookie');
    let usuarioEliminacionId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioEliminacionId = decoded.id;
        } catch (e) {}
      }
    }

    // Obtener IP y User-Agent
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_antes, ip, user_agent)
       VALUES ($1, 'ELIMINAR', 'productos', $2, $3::jsonb, $4::inet, $5)`,
      [
        usuarioEliminacionId,
        id,
        JSON.stringify(productoAntes),
        ip,
        userAgent
      ]
    );

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
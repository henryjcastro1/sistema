import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        codigo,
        nombre,
        simbolo,
        tasa_cambio,
        es_base,
        activo,
        created_at,
        updated_at
      FROM monedas 
      WHERE deleted_at IS NULL
      ORDER BY 
        CASE WHEN es_base THEN 0 ELSE 1 END,
        activo DESC,
        codigo
    `);

    // 👇 FORZAR UTF-8 EN LA RESPUESTA
    return new NextResponse(JSON.stringify(result.rows), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error GET monedas:", error);
    return NextResponse.json(
      { error: "Error obteniendo monedas" },
      { status: 500 }
    );
  }
}

// El resto de las funciones (POST, PUT, DELETE) quedan igual
export async function POST(req: Request) {
  try {
    const { codigo, nombre, simbolo, tasa_cambio, es_base = false } = await req.json();

    // Validaciones
    if (!codigo || !nombre || !simbolo || !tasa_cambio) {
      return NextResponse.json(
        { error: "Código, nombre, símbolo y tasa de cambio son requeridos" },
        { status: 400 }
      );
    }

    if (tasa_cambio <= 0) {
      return NextResponse.json(
        { error: "La tasa de cambio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // Verificar si ya existe la moneda
    const existe = await pool.query(
      `SELECT id FROM monedas WHERE codigo = $1 AND deleted_at IS NULL`,
      [codigo.toUpperCase()]
    );

    if (existe.rows.length > 0) {
      return NextResponse.json(
        { error: "Ya existe una moneda con ese código" },
        { status: 409 }
      );
    }

    // Si es moneda base, quitar base a las demás
    if (es_base) {
      await pool.query(
        `UPDATE monedas SET es_base = false WHERE es_base = true`
      );
    }

    // Insertar nueva moneda
    const result = await pool.query(
      `INSERT INTO monedas (codigo, nombre, simbolo, tasa_cambio, es_base)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [codigo.toUpperCase(), nombre, simbolo, tasa_cambio, es_base]
    );

    return NextResponse.json({
      success: true,
      message: "Moneda creada exitosamente",
      moneda: result.rows[0]
    });

  } catch (error) {
    console.error("Error POST moneda:", error);
    return NextResponse.json(
      { error: "Error creando moneda" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, codigo, nombre, simbolo, tasa_cambio, es_base, activo } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de moneda requerido" },
        { status: 400 }
      );
    }

    // Verificar que la moneda existe
    const existe = await pool.query(
      `SELECT * FROM monedas WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    // Si se está activando como base, quitar base a las demás
    if (es_base) {
      await pool.query(
        `UPDATE monedas SET es_base = false WHERE es_base = true`
      );
    }

    // Construir query dinámica
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (codigo) {
      updates.push(`codigo = $${paramIndex++}`);
      values.push(codigo.toUpperCase());
    }
    if (nombre) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (simbolo) {
      updates.push(`simbolo = $${paramIndex++}`);
      values.push(simbolo);
    }
    if (tasa_cambio) {
      updates.push(`tasa_cambio = $${paramIndex++}`);
      values.push(tasa_cambio);
    }
    if (es_base !== undefined) {
      updates.push(`es_base = $${paramIndex++}`);
      values.push(es_base);
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

    values.push(id);

    const query = `
      UPDATE monedas 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      message: "Moneda actualizada exitosamente",
      moneda: result.rows[0]
    });

  } catch (error) {
    console.error("Error PUT moneda:", error);
    return NextResponse.json(
      { error: "Error actualizando moneda" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID de moneda requerido" },
        { status: 400 }
      );
    }

    // Verificar si la moneda está siendo usada por productos
    const productosUsando = await pool.query(
      `SELECT COUNT(*) as count FROM productos WHERE moneda_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (parseInt(productosUsando.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la moneda porque está siendo usada por productos" },
        { status: 409 }
      );
    }

    // Soft delete
    await pool.query(
      `UPDATE monedas SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Moneda eliminada correctamente"
    });

  } catch (error) {
    console.error("Error DELETE moneda:", error);
    return NextResponse.json(
      { error: "Error eliminando moneda" },
      { status: 500 }
    );
  }
}
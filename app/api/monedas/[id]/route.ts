import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

// GET /api/monedas/[id] - Obtener una moneda específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
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
      WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET moneda por ID:", error);
    return NextResponse.json(
      { error: "Error obteniendo moneda" },
      { status: 500 }
    );
  }
}

// PUT /api/monedas/[id] - Actualizar moneda (para establecer como base)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { es_base } = await request.json();

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

    // Si se está estableciendo como base, quitar base a las demás
    if (es_base) {
      await pool.query(
        `UPDATE monedas SET es_base = false WHERE es_base = true`
      );
    }

    // Actualizar moneda
    const result = await pool.query(
      `UPDATE monedas 
       SET es_base = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [es_base, id]
    );

    return NextResponse.json({
      success: true,
      message: es_base ? "Moneda base actualizada" : "Moneda actualizada",
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

// PATCH /api/monedas/[id] - Actualizar estado (activar/desactivar)
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

    const moneda = existe.rows[0];

    // No permitir desactivar la moneda base
    if (moneda.es_base && !activo) {
      return NextResponse.json(
        { error: "No se puede desactivar la moneda base" },
        { status: 400 }
      );
    }

    // Actualizar estado
    const result = await pool.query(
      `UPDATE monedas 
       SET activo = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [activo, id]
    );

    return NextResponse.json({
      success: true,
      message: activo ? "Moneda activada" : "Moneda desactivada",
      moneda: result.rows[0]
    });

  } catch (error) {
    console.error("Error PATCH moneda:", error);
    return NextResponse.json(
      { error: "Error actualizando moneda" },
      { status: 500 }
    );
  }
}

// DELETE /api/monedas/[id] - Eliminar moneda (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const moneda = existe.rows[0];

    // No permitir eliminar la moneda base
    if (moneda.es_base) {
      return NextResponse.json(
        { error: "No se puede eliminar la moneda base" },
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
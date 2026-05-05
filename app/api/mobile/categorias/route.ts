import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        c.imagen_url,
        (
          SELECT COUNT(*) 
          FROM productos p 
          WHERE p.categoria_id = c.id 
            AND p.deleted_at IS NULL 
            AND p.activo = true
        ) as productos_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', sc.id,
              'nombre', sc.nombre,
              'descripcion', sc.descripcion,
              'productos_count', (
                SELECT COUNT(*) 
                FROM productos p 
                WHERE p.subcategoria_id = sc.id 
                  AND p.deleted_at IS NULL 
                  AND p.activo = true
              )
            ) ORDER BY sc.nombre
          )
          FROM subcategorias_producto sc
          WHERE sc.categoria_id = c.id AND sc.deleted_at IS NULL
        ) as subcategorias
      FROM categorias_producto c
      WHERE c.deleted_at IS NULL AND c.activo = true
      ORDER BY c.nombre
    `);

    return NextResponse.json({
      success: true,
      categorias: result.rows
    });

  } catch (error) {
    console.error("Error GET categorías:", error);
    return NextResponse.json(
      { error: "Error obteniendo categorías" },
      { status: 500 }
    );
  }
}
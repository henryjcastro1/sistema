import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoriaId = url.searchParams.get('categoria_id');

    if (!categoriaId) {
      return NextResponse.json(
        { error: "Se requiere categoria_id" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        id,
        nombre,
        descripcion,
        imagen_url,
        orden
       FROM subcategorias_producto 
       WHERE categoria_id = $1 
         AND activo = true 
         AND deleted_at IS NULL
       ORDER BY orden, nombre`,
      [categoriaId]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET subcategorías:", error);
    return NextResponse.json(
      { error: "Error obteniendo subcategorías" },
      { status: 500 }
    );
  }
}
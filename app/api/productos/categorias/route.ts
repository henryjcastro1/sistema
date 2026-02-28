import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        imagen_url,
        orden
      FROM categorias_producto 
      WHERE activo = true AND deleted_at IS NULL
      ORDER BY orden, nombre
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error GET categorías:", error);
    return NextResponse.json(
      { error: "Error obteniendo categorías" },
      { status: 500 }
    );
  }
}
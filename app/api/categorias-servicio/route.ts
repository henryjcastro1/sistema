// app/api/categorias-servicio/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown;
    
    // Todos los usuarios autenticados pueden ver categorías
    const result = await pool.query(`
      SELECT id, nombre, descripcion, icono, activo, orden
      FROM categorias_servicio
      WHERE activo = true AND deleted_at IS NULL
      ORDER BY orden ASC, nombre ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error GET categorias-servicio:", error);
    return NextResponse.json(
      { error: "Error al cargar categorías" },
      { status: 500 }
    );
  }
}
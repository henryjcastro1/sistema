import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

// Definir interfaz para el payload del token
interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 👇 CORREGIDO: Usar TokenPayload en lugar de any
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    // Verificar que es admin
    const userResult = await pool.query(
      `SELECT r.nombre as rol_nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (!['ADMIN', 'SUPERADMIN'].includes(userResult.rows[0]?.rol_nombre)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Obtener técnicos disponibles
    const result = await pool.query(`
      SELECT 
        t.id,
        t.nombre,
        t.apellido,
        t.email,
        COUNT(s.id) FILTER (WHERE s.estado = 'EN_PROCESO') as servicios_activos,
        ROUND(AVG(s.calificacion) FILTER (WHERE s.calificacion IS NOT NULL), 1) as calificacion_promedio
      FROM usuarios t
      LEFT JOIN servicios s ON t.id = s.tecnico_id AND s.deleted_at IS NULL
      WHERE t.rol_id = (SELECT id FROM roles WHERE nombre = 'TECNICO')
        AND t.deleted_at IS NULL
        AND t.bloqueado = false
      GROUP BY t.id, t.nombre, t.apellido, t.email
      ORDER BY servicios_activos ASC, calificacion_promedio DESC NULLS LAST
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET técnicos:", error);
    return NextResponse.json(
      { error: "Error al cargar técnicos" },
      { status: 500 }
    );
  }
}
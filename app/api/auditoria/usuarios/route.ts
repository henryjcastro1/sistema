import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    // Verificar autenticación (opcional, pero recomendado)
    const cookieHeader = req.headers.get('cookie');
    let usuarioId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioId = decoded.id;
        } catch (e) {
          console.log("Token inválido al acceder a auditoría");
        }
      }
    }

    // Si quieres que solo admins puedan ver auditoría, descomenta esto:
    // if (!usuarioId) {
    //   return NextResponse.json(
    //     { error: "No autorizado" },
    //     { status: 401 }
    //   );
    // }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const fechaInicio = url.searchParams.get('fechaInicio');
    const fechaFin = url.searchParams.get('fechaFin');
    const accion = url.searchParams.get('accion');
    const usuario = url.searchParams.get('usuario');
    const registroId = url.searchParams.get('registro_id');

    // Construir WHERE clause dinámico
    let whereConditions = ["tabla = 'usuarios'"];
    let values: any[] = [];
    let paramIndex = 1;

    if (fechaInicio) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      values.push(fechaInicio);
    }
    if (fechaFin) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      values.push(fechaFin);
    }
    if (accion && accion !== 'TODAS') {
      whereConditions.push(`accion = $${paramIndex++}`);
      values.push(accion);
    }
    if (usuario) {
      whereConditions.push(`usuario_id IN (SELECT id FROM usuarios WHERE email ILIKE $${paramIndex++})`);
      values.push(`%${usuario}%`);
    }
    if (registroId) {
      whereConditions.push(`registro_id = $${paramIndex++}`);
      values.push(registroId);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Obtener total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Obtener logs paginados
    const query = `
      SELECT 
        al.id,
        al.created_at,
        al.accion,
        al.tabla,
        al.registro_id,
        al.datos_antes,
        al.datos_despues,
        al.ip,
        al.user_agent,
        u.email as usuario_email,
        CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
      FROM audit_logs al
      LEFT JOIN usuarios u ON al.usuario_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, [...values, limit, offset]);

    return NextResponse.json({
      logs: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error GET auditoría:", error);
    return NextResponse.json(
      { error: "Error obteniendo logs de auditoría" },
      { status: 500 }
    );
  }
}
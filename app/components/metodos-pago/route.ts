import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

// Definir el tipo del token decodificado
interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

export async function GET(req: Request) {
  try {
    // Verificar autenticación
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let usuarioId: string;
    try {
      // 👇 CORREGIDO: Tipado específico en lugar de 'any'
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      usuarioId = decoded.id;
    } catch (e) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Obtener métodos de pago del usuario
    const result = await pool.query(
      `SELECT 
        id,
        tipo,
        ultimos_digitos,
        titular,
        es_principal,
        created_at
      FROM metodos_pago_usuario 
      WHERE usuario_id = $1 AND deleted_at IS NULL
      ORDER BY es_principal DESC, created_at DESC`,
      [usuarioId]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET métodos de pago:", error);
    return NextResponse.json(
      { error: "Error obteniendo métodos de pago" },
      { status: 500 }
    );
  }
}
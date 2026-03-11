import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

export async function POST(req: Request) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verificar token (opcional, podemos registrar quién hizo logout)
    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      userId = decoded.id;
    } catch (error) {
      // Token inválido, pero igual podemos hacer logout
      console.log("Logout con token inválido");
    }

    // Registrar en auditoría si tenemos el usuario
    if (userId) {
      await pool.query(
        `INSERT INTO audit_logs (usuario_id, accion, tabla, ip)
         VALUES ($1, 'LOGOUT_MOBILE', 'usuarios', $2::inet)`,
        [userId, req.headers.get('x-forwarded-for') || '0.0.0.0']
      );
    }

    // Para JWT, el logout se maneja del lado del cliente
    // Solo retornamos éxito para que la app sepa que fue exitoso
    return NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente"
    });

  } catch (error) {
    console.error("Error en logout móvil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
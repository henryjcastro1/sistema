import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

// Definir interfaz para el payload del token
interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

export async function GET(req: Request) {
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

    // Verificar token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Obtener datos actualizados del usuario
    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        apellido,
        u.email,
        u.foto_url,
        u.bloqueado,
        r.nombre as rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1
         AND u.deleted_at IS NULL`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Verificar si está bloqueado
    if (user.bloqueado) {
      return NextResponse.json(
        { error: "Usuario bloqueado" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_nombre,
        foto_url: user.foto_url,
        nombre_completo: `${user.nombre} ${user.apellido}`
      }
    });

  } catch (error) {
    console.error("Error en me móvil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
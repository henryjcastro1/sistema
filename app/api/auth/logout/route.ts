import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // Obtener token de las cookies
    const token = request.cookies.get("token")?.value;
    
    // Obtener IP y User-Agent para auditoría
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    const userAgent = request.headers.get('user-agent') || '';

    if (token) {
      try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
          email: string;
          rol: string;
        };
        
        // ✅ MEJORADO: Registrar LOGOUT con TODOS los campos
        await pool.query(
          `INSERT INTO audit_logs 
            (usuario_id, accion, tabla, registro_id, ip, user_agent, datos_despues)
           VALUES ($1, 'LOGOUT', 'usuarios', $2, $3::inet, $4, $5::jsonb)`,
          [
            decoded.id,                          // Quién hizo logout
            decoded.id,                           // El mismo usuario (registro_id)
            ip,                                   // IP del usuario
            userAgent,                            // Navegador/dispositivo
            JSON.stringify({                      // Datos adicionales
              email: decoded.email,
              rol: decoded.rol,
              timestamp: new Date().toISOString(),
              metodo: 'logout_manual'
            })
          ]
        );
        
        console.log(`✅ Logout exitoso para usuario: ${decoded.email}`);
        
      } catch (jwtError) {
        // Token inválido o expirado - registrar intento fallido
        await pool.query(
          `INSERT INTO audit_logs 
            (accion, tabla, ip, user_agent, datos_despues)
           VALUES ('LOGOUT_FALLIDO', 'usuarios', $1::inet, $2, $3::jsonb)`,
          [
            ip,
            userAgent,
            JSON.stringify({
              error: 'Token inválido o expirado',
              timestamp: new Date().toISOString()
            })
          ]
        );
        console.log("⚠️ Token inválido en logout:", jwtError);
      }
    } else {
      // No había token - registrar intento sin sesión
      await pool.query(
        `INSERT INTO audit_logs 
          (accion, tabla, ip, user_agent, datos_despues)
         VALUES ('LOGOUT_SIN_SESION', 'usuarios', $1::inet, $2, $3::jsonb)`,
        [
          ip,
          userAgent,
          JSON.stringify({
            timestamp: new Date().toISOString()
          })
        ]
      );
    }

    // Crear respuesta
    const response = NextResponse.json({ 
      success: true, 
      message: "Sesión cerrada correctamente" 
    });
    
    // Eliminar la cookie
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expira inmediatamente
    });

    return response;

  } catch (error) {
    console.error("❌ Error en logout:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
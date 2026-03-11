import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    // Verificar si el email existe en la base de datos
    const result = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    return NextResponse.json({
      existe: result.rows.length > 0
    });

  } catch (error) {
    console.error("Error verificando email:", error);
    return NextResponse.json(
      { error: "Error al verificar email" },
      { status: 500 }
    );
  }
}
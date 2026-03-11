import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const LOGO_DIR = path.join(process.cwd(), "public/uploads/empresa");

interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

// GET - Obtener configuración de empresa
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM configuracion_empresa ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        nombre_empresa: 'HelpDesk',
        color_primario: '#2563eb',
        color_secundario: '#1e40af'
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error GET config empresa:", error);
    return NextResponse.json(
      { error: "Error al cargar configuración" },
      { status: 500 }
    );
  }
}

// POST - Actualizar configuración de empresa
export async function POST(req: Request) {
  try {
    // Verificar autenticación y permisos de admin
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Verificar que es admin
    const userResult = await pool.query(
      `SELECT r.nombre as rol_nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    const rol = userResult.rows[0]?.rol_nombre;
    if (!['ADMIN', 'SUPERADMIN'].includes(rol)) {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    
    const nombre_empresa = formData.get('nombre_empresa') as string;
    const color_primario = formData.get('color_primario') as string;
    const color_secundario = formData.get('color_secundario') as string;
    const email_contacto = formData.get('email_contacto') as string;
    const telefono = formData.get('telefono') as string;
    const direccion = formData.get('direccion') as string;
    const logo = formData.get('logo') as File | null;

    let logo_url = null;

    // Procesar logo si se subió uno nuevo
    if (logo && logo.size > 0) {
      // Validar tipo de archivo
      if (!logo.type.startsWith('image/')) {
        return NextResponse.json(
          { error: "El archivo debe ser una imagen" },
          { status: 400 }
        );
      }

      // Validar tamaño (máx 2MB)
      if (logo.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "La imagen no debe superar los 2MB" },
          { status: 400 }
        );
      }

      try {
        // Crear directorio si no existe
        await mkdir(LOGO_DIR, { recursive: true });

        // Generar nombre único
        const extension = logo.name.split('.').pop();
        const fileName = `logo-${uuidv4()}.${extension}`;
        const filePath = path.join(LOGO_DIR, fileName);
        
        // Guardar archivo
        const bytes = await logo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        logo_url = `/uploads/empresa/${fileName}`;
      } catch (uploadError) {
        console.error("Error subiendo logo:", uploadError);
        return NextResponse.json(
          { error: "Error al subir el logo" },
          { status: 500 }
        );
      }
    }

    // Actualizar configuración
    const updateQuery = `
      UPDATE configuracion_empresa 
      SET 
        nombre_empresa = COALESCE($1, nombre_empresa),
        color_primario = COALESCE($2, color_primario),
        color_secundario = COALESCE($3, color_secundario),
        email_contacto = COALESCE($4, email_contacto),
        telefono = COALESCE($5, telefono),
        direccion = COALESCE($6, direccion),
        ${logo_url ? 'logo_url = $7,' : ''}
        updated_at = NOW()
      WHERE id = (SELECT id FROM configuracion_empresa ORDER BY created_at DESC LIMIT 1)
      RETURNING *;
    `;

    const values = [
      nombre_empresa || null,
      color_primario || null,
      color_secundario || null,
      email_contacto || null,
      telefono || null,
      direccion || null,
    ];

    if (logo_url) {
      values.push(logo_url);
    }

    const result = await pool.query(updateQuery, values);

    return NextResponse.json({
      success: true,
      message: "Configuración actualizada correctamente",
      config: result.rows[0]
    });

  } catch (error) {
    console.error("Error POST config empresa:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
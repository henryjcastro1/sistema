import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Esperar a que se resuelvan los parámetros
    const { path: pathParts } = await params;
    
    // Construir la ruta completa del archivo
    const filePath = path.join(process.cwd(), 'uploads', 'comprobantes', ...pathParts);
    
    console.log('Intentando acceder a:', filePath);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('Archivo no encontrado:', filePath);
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determinar el tipo MIME basado en la extensión
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Devolver el archivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error sirviendo archivo:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
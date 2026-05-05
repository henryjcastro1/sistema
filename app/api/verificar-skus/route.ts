// app/api/productos/verificar-skus/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";

interface ProductoRow {
  sku: string;
  nombre: string;
}

export async function POST(req: Request) {
  try {
    const { skus } = await req.json();
    
    console.log("🔍 Verificando SKUs:", skus);
    
    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: "Lista de SKUs requerida" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      `SELECT sku, nombre FROM productos WHERE sku = ANY($1) AND deleted_at IS NULL`,
      [skus]
    );
    
    console.log("📊 SKUs encontrados:", result.rows);
    
    // Tipar manualmente con as
    const rows = result.rows as ProductoRow[];
    const skusExistentes = rows.map((row) => row.sku);
    const skusNoEncontrados = skus.filter((sku: string) => !skusExistentes.includes(sku));
    
    const response = {
      productos: rows,
      noEncontrados: skusNoEncontrados
    };
    
    console.log("📤 Respuesta:", response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("❌ Error verificando SKUs:", error);
    return NextResponse.json(
      { 
        error: "Error al verificar SKUs", 
        message: error instanceof Error ? error.message : "Error desconocido" 
      },
      { status: 500 }
    );
  }
}
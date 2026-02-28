// app/api/upload/route.ts
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: "usuarios",
      transformation: [
        { width: 200, height: 200, crop: "fill" }, // Redimensionar
        { quality: "auto" } // Optimizar
      ]
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return NextResponse.json(
      { error: "Error subiendo imagen" },
      { status: 500 }
    );
  }
}
import { pool } from "@/lib/bd";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");
    return NextResponse.json({ success: true, time: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }
}
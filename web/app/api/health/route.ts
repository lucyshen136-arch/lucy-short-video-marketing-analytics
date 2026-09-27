import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    return NextResponse.json(
      { status: "degraded", database: error instanceof Error ? error.message : "error" },
      { status: 503 },
    );
  }
}

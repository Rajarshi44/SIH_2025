import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/server/auth";
import { getConnectionStats } from "@/server/websocket";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const stats = getConnectionStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Telemetry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

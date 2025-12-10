import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/server/auth";
import { sendToAllDevices } from "@/server/websocket";

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { motor } = body; // "A" or "B"

    if (!motor || !["A", "B"].includes(motor)) {
      return NextResponse.json(
        { error: "Motor must be A or B" },
        { status: 400 }
      );
    }

    const command = {
      type: "command",
      command: "START",
      motor,
      timestamp: new Date().toISOString(),
    };

    const sent = sendToAllDevices(command);

    return NextResponse.json({
      success: sent,
      message: sent ? "Command sent to device" : "No devices connected",
      command,
    });
  } catch (error) {
    console.error("[API] Start command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/server/auth";
import { sendToAllDevices } from "@/server/websocket";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { motor, speed } = body;

    if (!motor || !["A", "B"].includes(motor)) {
      return NextResponse.json(
        { error: "Motor must be A or B" },
        { status: 400 }
      );
    }

    if (typeof speed !== "number" || speed < 0 || speed > 100) {
      return NextResponse.json(
        { error: "Speed must be between 0 and 100" },
        { status: 400 }
      );
    }

    const command = {
      type: "command",
      command: "SET_SPEED",
      motor,
      value: speed,
      timestamp: new Date().toISOString(),
    };

    const sent = sendToAllDevices(command);

    return NextResponse.json({
      success: sent,
      message: sent ? "Command sent to device" : "No devices connected",
      command,
    });
  } catch (error) {
    console.error("[API] Set speed command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

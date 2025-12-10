import { NextRequest, NextResponse } from "next/server";
import { sendToAllDevices } from "@/server/websocket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { motor, command: customCommand } = body; // "A" or "B", and optional custom command

    // Normalize motor to uppercase
    motor = motor?.toUpperCase();

    // If custom command is provided, use it; otherwise default to START
    const commandType = customCommand || "START";

    // For LED commands, motor parameter is not required
    if (!customCommand && (!motor || !["A", "B"].includes(motor))) {
      return NextResponse.json(
        { error: "Motor must be A or B" },
        { status: 400 }
      );
    }

    const command = {
      type: "command",
      command: commandType,
      motor: motor || "A",
      timestamp: new Date().toISOString(),
    };

    const sent = sendToAllDevices(command);

    return NextResponse.json({
      success: sent,
      message: sent ? "Command sent to device" : "No devices connected",
      command,
    });
  } catch (error) {
    console.error("[API] Command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

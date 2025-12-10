import { NextRequest, NextResponse } from "next/server";
import { sendToAllDevices } from "@/server/websocket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { motor } = body;

    // Normalize motor to uppercase
    motor = motor?.toUpperCase();

    if (!motor || !["A", "B"].includes(motor)) {
      return NextResponse.json(
        { error: "Motor must be A or B" },
        { status: 400 }
      );
    }

    const command = {
      type: "command",
      command: "STOP",
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
    console.error("[API] Stop command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

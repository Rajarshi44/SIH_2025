import { NextRequest, NextResponse } from "next/server";
import { sendToAllDevices } from "@/server/websocket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { motor, direction } = body; // motor: "A" or "B", direction: "forward" or "reverse"

    // Normalize motor to uppercase
    motor = motor?.toUpperCase();

    if (!motor || !["A", "B"].includes(motor)) {
      return NextResponse.json(
        { error: "Motor must be A or B" },
        { status: 400 }
      );
    }

    if (
      !direction ||
      !["forward", "reverse", "FORWARD", "REVERSE"].includes(direction)
    ) {
      return NextResponse.json(
        { error: "Direction must be forward or reverse" },
        { status: 400 }
      );
    }

    const command = {
      type: "command",
      command: "SET_DIRECTION",
      motor,
      direction: direction.toLowerCase(),
      timestamp: new Date().toISOString(),
    };

    const sent = sendToAllDevices(command);

    return NextResponse.json({
      success: sent,
      message: sent
        ? `Motor ${motor} direction set to ${direction}`
        : "No devices connected",
      command,
    });
  } catch (error) {
    console.error("[API] Set direction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

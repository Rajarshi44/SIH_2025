"use client";

import { useEffect } from "react";
import { wsService } from "@/services/api";

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    // Connect to WebSocket when component mounts
    wsService.connect();

    return () => {
      // Cleanup on unmount
      wsService.disconnect();
    };
  }, []);

  return <>{children}</>;
};

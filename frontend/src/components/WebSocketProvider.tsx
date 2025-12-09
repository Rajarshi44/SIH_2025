"use client";

import { useEffect } from "react";
import { wsService } from "@/services/api";
import useStore from "@/store/useStore";

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    wsService.connect(settings.wsEndpoint);

    return () => {
      wsService.disconnect();
    };
  }, [settings.wsEndpoint]);

  return <>{children}</>;
};

"use client";

import { useEffect } from "react";
import { connectMqtt } from "@/lib/realtime/mqtt-client";
import { connectWebSocket } from "@/lib/realtime/websocket-client";

interface TelemetryProviderProps {
  children: React.ReactNode;
  mode?: "websocket" | "mqtt" | "demo";
  wsUrl?: string;
  mqttUrl?: string;
  mqttTopicPrefix?: string;
}

export function TelemetryProvider({
  children,
  mode = "demo",
  wsUrl,
  mqttUrl,
  mqttTopicPrefix,
}: TelemetryProviderProps) {
  useEffect(() => {
    if (mode === "websocket" && wsUrl) {
      return connectWebSocket({ url: wsUrl });
    }

    if (mode === "mqtt" && mqttUrl) {
      return connectMqtt({ brokerUrl: mqttUrl, topicPrefix: mqttTopicPrefix });
    }

    // demo mode: no connection
    return undefined;
  }, [mode, wsUrl, mqttUrl, mqttTopicPrefix]);

  return <>{children}</>;
}

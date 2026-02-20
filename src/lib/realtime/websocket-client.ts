"use client";

import { io, type Socket } from "socket.io-client";
import { useTelemetryStore } from "@/store/use-telemetry";
import type { TelemetryMessage } from "@/types/telemetry";

let socket: Socket | null = null;

export interface WebSocketClientOptions {
  url: string;
  topics?: string[];
}

export function connectWebSocket(options: WebSocketClientOptions): () => void {
  const { url, topics = ["telemetry"] } = options;
  const { enqueue, setConnected } = useTelemetryStore.getState();

  socket = io(url, {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    setConnected(true, "websocket");
    for (const topic of topics) {
      socket?.emit("subscribe", topic);
    }
  });

  socket.on("disconnect", () => {
    setConnected(false);
  });

  socket.on("telemetry", (raw: unknown) => {
    const msg = normalizeWebSocketMessage(raw);
    if (msg) {
      enqueue(msg);
    }
  });

  socket.on("data", (raw: unknown) => {
    const msg = normalizeWebSocketMessage(raw);
    if (msg) {
      enqueue(msg);
    }
  });

  return () => {
    socket?.disconnect();
    socket = null;
    setConnected(false);
  };
}

function normalizeWebSocketMessage(raw: unknown): TelemetryMessage | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const data = raw as Record<string, unknown>;
  return {
    machineId: String(data.machineId ?? data.machine_id ?? data.deviceId ?? "unknown"),
    sensorId: String(data.sensorId ?? data.sensor_id ?? data.id ?? "sensor"),
    sensorName: String(data.sensorName ?? data.sensor_name ?? data.name ?? "Sensor"),
    sensorType: String(data.sensorType ?? data.sensor_type ?? data.type ?? "generic"),
    unit: data.unit ? String(data.unit) : undefined,
    value: Number(data.value ?? 0),
    timestamp: Number(data.timestamp ?? Date.now()),
    source: "websocket",
  };
}

export function disconnectWebSocket(): void {
  socket?.disconnect();
  socket = null;
  useTelemetryStore.getState().setConnected(false);
}

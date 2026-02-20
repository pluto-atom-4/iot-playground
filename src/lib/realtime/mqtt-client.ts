"use client";

import mqtt, { type MqttClient } from "mqtt";
import { useTelemetryStore } from "@/store/use-telemetry";
import type { TelemetryMessage } from "@/types/telemetry";

let client: MqttClient | null = null;

export interface MqttClientOptions {
  brokerUrl: string;
  topicPrefix?: string;
  clientId?: string;
}

export function connectMqtt(options: MqttClientOptions): () => void {
  const { brokerUrl, topicPrefix = "iot/machines", clientId = `iot-dashboard-${Date.now()}` } = options;
  const { enqueue, setConnected } = useTelemetryStore.getState();

  client = mqtt.connect(brokerUrl, {
    clientId,
    reconnectPeriod: 2000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    setConnected(true, "mqtt");
    client?.subscribe(`${topicPrefix}/#`, { qos: 1 });
  });

  client.on("offline", () => {
    setConnected(false);
  });

  client.on("error", (_err: Error) => {
    setConnected(false);
  });

  client.on("message", (topic: string, payload: Buffer) => {
    const msg = normalizeMqttMessage(topic, payload, topicPrefix);
    if (msg) {
      enqueue(msg);
    }
  });

  return () => {
    client?.end(true);
    client = null;
    setConnected(false);
  };
}

function normalizeMqttMessage(
  topic: string,
  payload: Buffer,
  topicPrefix: string,
): TelemetryMessage | null {
  try {
    const raw = JSON.parse(payload.toString()) as Record<string, unknown>;

    // Topic pattern: {prefix}/{machineId}/{sensorId}
    const segments = topic.replace(`${topicPrefix}/`, "").split("/");
    const machineId = segments[0] ?? String(raw.machineId ?? raw.machine_id ?? "unknown");
    const sensorId = segments[1] ?? String(raw.sensorId ?? raw.sensor_id ?? "sensor");

    return {
      machineId,
      sensorId,
      sensorName: String(raw.sensorName ?? raw.sensor_name ?? raw.name ?? sensorId),
      sensorType: String(raw.sensorType ?? raw.sensor_type ?? raw.type ?? "generic"),
      unit: raw.unit ? String(raw.unit) : undefined,
      value: Number(raw.value ?? 0),
      timestamp: Number(raw.timestamp ?? Date.now()),
      source: "mqtt",
    };
  } catch {
    return null;
  }
}

export function disconnectMqtt(): void {
  client?.end(true);
  client = null;
  useTelemetryStore.getState().setConnected(false);
}

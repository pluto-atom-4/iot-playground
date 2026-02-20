"use client";

import { create } from "zustand";
import type { MachineState, TelemetryMessage } from "@/types/telemetry";

const MAX_HISTORY = 50;
const THROTTLE_MS = 200;

interface TelemetryStore {
  machines: Record<string, MachineState>;
  pendingUpdates: TelemetryMessage[];
  lastFlush: number;
  isConnected: boolean;
  connectionSource: "websocket" | "mqtt" | "none";
  enqueue: (msg: TelemetryMessage) => void;
  flush: () => void;
  setConnected: (connected: boolean, source?: "websocket" | "mqtt") => void;
  reset: () => void;
}

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  machines: {},
  pendingUpdates: [],
  lastFlush: 0,
  isConnected: false,
  connectionSource: "none",

  enqueue: (msg: TelemetryMessage) => {
    const now = Date.now();
    const { lastFlush } = get();

    set((state) => ({
      pendingUpdates: [...state.pendingUpdates, msg],
    }));

    if (now - lastFlush >= THROTTLE_MS) {
      get().flush();
    }
  },

  flush: () => {
    const { pendingUpdates } = get();
    if (pendingUpdates.length === 0) {
      return;
    }

    set((state) => {
      const machines = { ...state.machines };

      for (const msg of pendingUpdates) {
        const existing = machines[msg.machineId];
        const point = {
          timestamp: msg.timestamp,
          value: msg.value,
          sensorId: msg.sensorId,
          unit: msg.unit,
        };

        if (!existing) {
          machines[msg.machineId] = {
            id: msg.machineId,
            name: msg.machineId,
            status: "active",
            sensors: [
              {
                id: msg.sensorId,
                name: msg.sensorName,
                type: msg.sensorType,
                unit: msg.unit,
                latest: point,
                history: [point],
                source: msg.source,
              },
            ],
            lastUpdated: msg.timestamp,
          };
        } else {
          const sensors = [...existing.sensors];
          const sensorIdx = sensors.findIndex((s) => s.id === msg.sensorId);

          if (sensorIdx === -1) {
            sensors.push({
              id: msg.sensorId,
              name: msg.sensorName,
              type: msg.sensorType,
              unit: msg.unit,
              latest: point,
              history: [point],
              source: msg.source,
            });
          } else {
            const sensor = sensors[sensorIdx];
            const history = [...sensor.history, point].slice(-MAX_HISTORY);
            sensors[sensorIdx] = { ...sensor, latest: point, history };
          }

          machines[msg.machineId] = {
            ...existing,
            sensors,
            lastUpdated: msg.timestamp,
            status: "active",
          };
        }
      }

      return { machines, pendingUpdates: [], lastFlush: Date.now() };
    });
  },

  setConnected: (connected, source = "none") => {
    set({ isConnected: connected, connectionSource: connected ? source : "none" });
  },

  reset: () => {
    set({ machines: {}, pendingUpdates: [], lastFlush: 0, isConnected: false, connectionSource: "none" });
  },
}));

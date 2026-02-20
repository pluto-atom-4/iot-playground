"use client";

import { useTelemetryStore } from "@/store/use-telemetry";

export function ConnectionStatus() {
  const { isConnected, connectionSource } = useTelemetryStore();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
      />
      <span className="text-gray-400">
        {isConnected ? `Connected via ${connectionSource}` : "Disconnected"}
      </span>
    </div>
  );
}

"use client";

import { LiveChart } from "@/components/LiveChart";
import type { MachineState } from "@/types/telemetry";

interface MachineCardProps {
  machine: MachineState;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  error: "bg-red-500",
};

const SENSOR_CHART_COLORS: string[] = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function MachineCard({ machine }: MachineCardProps) {
  const statusColor = STATUS_COLORS[machine.status] ?? "bg-gray-500";
  const timeSince = Math.floor((Date.now() - machine.lastUpdated) / 1000);

  return (
    <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{machine.name}</h3>
          {machine.location && (
            <p className="text-gray-400 text-sm mt-0.5">📍 {machine.location}</p>
          )}
          {machine.description && (
            <p className="text-gray-500 text-xs mt-1">{machine.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-gray-400 text-xs capitalize">{machine.status}</span>
        </div>
      </div>

      {/* Sensors */}
      {machine.sensors.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No sensor data</p>
      ) : (
        <div className="flex flex-col gap-4">
          {machine.sensors.map((sensor, idx) => (
            <div key={sensor.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm font-medium">{sensor.name}</span>
                <div className="flex items-center gap-2">
                  {sensor.latest && (
                    <span className="text-white font-mono text-sm font-bold">
                      {sensor.latest.value.toFixed(2)}
                      {sensor.unit && <span className="text-gray-400 text-xs ml-0.5">{sensor.unit}</span>}
                    </span>
                  )}
                  <span className="text-gray-600 text-xs">{sensor.source}</span>
                </div>
              </div>
              <LiveChart
                data={sensor.history}
                unit={sensor.unit}
                color={SENSOR_CHART_COLORS[idx % SENSOR_CHART_COLORS.length]}
                height={100}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
        <span className="text-gray-500 text-xs">{machine.sensors.length} sensor(s)</span>
        <span className="text-gray-500 text-xs">
          {timeSince < 5 ? "just now" : `${timeSince}s ago`}
        </span>
      </div>
    </div>
  );
}

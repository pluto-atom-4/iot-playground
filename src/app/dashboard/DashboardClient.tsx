"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MachineCard } from "@/components/MachineCard";
import { useTelemetryStore } from "@/store/use-telemetry";

const DEMO_MACHINE_IDS = ["machine-001", "machine-002"];
const DEMO_SENSORS: Record<string, Array<{ id: string; name: string; type: string; unit: string }>> = {
  "machine-001": [
    { id: "temp-1", name: "Temperature", type: "temperature", unit: "°C" },
    { id: "pressure-1", name: "Pressure", type: "pressure", unit: "kPa" },
  ],
  "machine-002": [
    { id: "rpm-1", name: "RPM", type: "speed", unit: "rpm" },
    { id: "vibration-1", name: "Vibration", type: "vibration", unit: "mm/s" },
  ],
};

function generateDemoValue(type: string): number {
  switch (type) {
    case "temperature":
      return 60 + Math.random() * 40;
    case "pressure":
      return 90 + Math.random() * 30;
    case "speed":
      return 800 + Math.random() * 400;
    case "vibration":
      return Math.random() * 5;
    default:
      return Math.random() * 100;
  }
}

export function DashboardClient() {
  const { machines, enqueue, flush } = useTelemetryStore();

  // Demo: generate fake telemetry data
  useEffect(() => {
    const interval = setInterval(() => {
      for (const machineId of DEMO_MACHINE_IDS) {
        const sensors = DEMO_SENSORS[machineId] ?? [];
        for (const sensor of sensors) {
          enqueue({
            machineId,
            sensorId: sensor.id,
            sensorName: sensor.name,
            sensorType: sensor.type,
            unit: sensor.unit,
            value: generateDemoValue(sensor.type),
            timestamp: Date.now(),
            source: "websocket",
          });
        }
      }
      flush();
    }, 500);

    return () => clearInterval(interval);
  }, [enqueue, flush]);

  const machineList = Object.values(machines);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">IoT Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time machine telemetry</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {machineList.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Waiting for telemetry data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="machine-grid">
            {machineList.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

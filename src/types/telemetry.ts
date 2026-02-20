export type DataSource = "websocket" | "mqtt";

export interface TelemetryPoint {
  timestamp: number;
  value: number;
  sensorId: string;
  unit?: string;
}

export interface SensorState {
  id: string;
  name: string;
  type: string;
  unit?: string;
  latest: TelemetryPoint | null;
  history: TelemetryPoint[];
  source: DataSource;
}

export interface MachineState {
  id: string;
  name: string;
  description?: string;
  location?: string;
  status: "active" | "idle" | "error";
  sensors: SensorState[];
  lastUpdated: number;
}

export interface TelemetryMessage {
  machineId: string;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  unit?: string;
  value: number;
  timestamp: number;
  source: DataSource;
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-950 text-white">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-400">IoT Dashboard</h1>
        <p className="text-gray-400 mb-8 text-lg">
          Real-time machine telemetry via WebSocket and MQTT
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

# IoT Playground

A real-time IoT monitoring dashboard built with Next.js. It ingests machine telemetry from MQTT brokers and WebSocket servers, persists the data with Prisma, and visualises it in an authenticated dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| Auth | [Clerk](https://clerk.com/) |
| Database | [Prisma](https://www.prisma.io/) + [libSQL](https://github.com/libsql/libsql) (SQLite) |
| Real-time | [MQTT.js](https://github.com/mqttjs/MQTT.js), [Socket.IO client](https://socket.io/) |
| Charts | [Recharts](https://recharts.org/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Linter / Formatter | [Biome](https://biomejs.dev/) |
| E2E tests | [Playwright](https://playwright.dev/) |
| Package manager | [pnpm](https://pnpm.io/) |

## Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9 (`npm install -g pnpm@9`)
- A [Clerk](https://clerk.com/) account (free tier is sufficient)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/pluto-atom-4/iot-playground.git
cd iot-playground
pnpm install
```

> **Note:** After the install completes you may see the following warning about ignored build scripts:
>
> ```
> ╭ Warning ───────────────────────────────────────────────────────────────────────────────────────────────╮
> │                                                                                                        │
> │   Ignored build scripts: @clerk/shared@3.46.0, @prisma/engines@7.4.1, esbuild@0.27.3, prisma@7.4.1,  │
> │   sharp@0.34.5.                                                                                        │
> │   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.               │
> │                                                                                                        │
> ╰────────────────────────────────────────────────────────────────────────────────────────────────────────╯
> ```
>
> Run the following command to approve package build scripts:
>
> ```bash
> pnpm approve-builds
> ```
>
> pnpm will show an interactive checklist. Press `a` to toggle all packages on, then press `Enter` to confirm:
>
> ```
> ? Choose which packages to build
>   (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
> ❯◉ @clerk/shared@3.46.0
>  ◉ @prisma/engines@7.4.1
>  ◉ esbuild@0.27.3
>  ◉ prisma@7.4.1
>  ◉ sharp@0.34.5
> ```
>
> **Select all packages.** Here is why each one is required:
>
> | Package | Why it needs a build script |
> |---|---|
> | `@clerk/shared` | Compiles Clerk's shared authentication helpers used at runtime |
> | `@prisma/engines` | Downloads and unpacks the native Prisma query-engine binary for your OS |
> | `esbuild` | Installs the native esbuild binary used by Next.js / Turbopack for bundling |
> | `prisma` | Runs `prisma generate` (via the `postinstall` script) to create the typed Prisma Client |
> | `sharp` | Compiles the native image-processing addon used by Next.js for `<Image>` optimization |

### 2. Configure environment variables

Copy the example below into a `.env.local` file and fill in your values:

```dotenv
# Clerk – get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirect URLs (defaults work for local dev)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database – local SQLite file (default) or a libSQL / Turso remote URL
DATABASE_URL="file:./prisma/dev.db"

# Real-time data sources (optional – leave empty to skip connection)
NEXT_PUBLIC_MQTT_BROKER_URL=ws://localhost:9001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 3. Set up the database

```bash
pnpm dlx prisma migrate dev --name init
```

This creates the local SQLite database at `prisma/dev.db` with the `machines`, `sensors`, and `telemetry_logs` tables.

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
iot-playground/
├── prisma/
│   └── schema.prisma        # Database schema (Machine → Sensor → TelemetryLog)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (ClerkProvider)
│   │   ├── page.tsx          # Landing page
│   │   └── dashboard/        # Protected dashboard route
│   ├── components/           # Shared UI components
│   ├── lib/
│   │   └── realtime/
│   │       ├── mqtt-client.ts      # MQTT connection helper
│   │       └── websocket-client.ts # WebSocket (Socket.IO) helper
│   ├── store/                # Zustand stores
│   └── types/                # TypeScript types
├── e2e/                      # Playwright end-to-end tests
├── biome.json                # Linter / formatter config
└── next.config.ts
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint and auto-fix with Biome |
| `pnpm lint:check` | Lint without writing changes |
| `pnpm format` | Format all files with Biome |
| `pnpm check:biome` | Run all Biome checks and auto-fix |
| `pnpm approve-builds` | Allow dependency build scripts after `pnpm install` |
| `pnpm e2e` | Run Playwright end-to-end tests |
| `pnpm e2e:debug` | Run Playwright tests in debug mode |

## Authentication

The `/dashboard` route is protected by Clerk. All other routes are public. Authentication is bypassed automatically during CI (`NEXT_PUBLIC_CI=true`). **Never set this variable in a production environment.**

## Real-time Data Sources

The dashboard can receive telemetry from two sources simultaneously:

- **MQTT** – connects to a broker (e.g. Mosquitto) at `NEXT_PUBLIC_MQTT_BROKER_URL` and subscribes to `iot/machines/#`. Expected topic pattern: `iot/machines/{machineId}/{sensorId}`.
- **WebSocket** – connects to a Socket.IO server at `NEXT_PUBLIC_WS_URL` and listens for `telemetry` / `data` events.

Both sources normalise incoming messages into a common `TelemetryMessage` shape before updating the Zustand store.

## Database Schema

```
Machine
  └── Sensor (many)
        └── TelemetryLog (many)
```

Cascade deletes are configured so removing a machine removes all its sensors and logs.

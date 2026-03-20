# MachineNet — IoT Machine Economy on Stacks

A decentralized IoT payment network where machines autonomously pay each other for services using the **x402 payment protocol** on **Stacks blockchain**.

![Architecture](https://img.shields.io/badge/Protocol-x402-blue)
![Stacks](https://img.shields.io/badge/Blockchain-Stacks-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

---

## Overview

MachineNet demonstrates a **machine-to-machine economy** where IoT devices interact and pay each other for services using micropayments. Every service requires an HTTP 402 payment before access is granted.

### Example Scenario

```
🚗 Electric Car  ──pays──►  ⚡ Charging Station  ──pays──►  📊 Energy Sensor
       │
       └──────────pays──►  🅿️ Parking Meter
```

---

## Architecture

```
┌─────────────┐     HTTP Request      ┌────────────────────┐
│             │ ───────────────────►  │                    │
│  IoT Device │                       │   MachineNet API   │
│  (Client)   │  ◄─── 402 Payment ── │   (Express + x402) │
│             │       Required        │                    │
└──────┬──────┘                       └─────────┬──────────┘
       │                                        │
       │  x402 Payment                          │  Verify TX
       │  (USDCx / sBTC)                        │
       │                                        │
┌──────▼──────────────────────────────────────────▼─────────┐
│                   Stacks Blockchain                       │
└───────────────────────────────────────────────────────────┘
```

### Payment Flow

1. Device sends request to service endpoint
2. Server returns **HTTP 402 Payment Required** with x402 instructions
3. Device submits payment on Stacks (USDCx or sBTC)
4. Device retries request with `X-Payment-TxId` header
5. Server verifies payment and delivers service

---

## Project Structure

```
machinenet/
├── frontend/          # Next.js dashboard (TypeScript, TailwindCSS)
├── backend/           # Express API server with x402 middleware
├── devices/           # Simulated IoT device scripts
└── contracts/         # Clarity smart contracts (optional)
```

---

## Machine Services

| Service | Endpoint | Price | Currency |
|---------|----------|-------|----------|
| EV Charging Station | `POST /api/services/charge/start` | 0.50 | USDCx |
| Smart Parking Meter | `POST /api/services/parking/pay` | 0.10 | USDCx |
| Energy Price Sensor | `GET /api/services/energy/price` | 0.03 | USDCx |
| Weather Sensor | `GET /api/services/weather` | 0.02 | USDCx |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Server starts at `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:3000`

### 3. IoT Device Simulation

```bash
cd devices
npm install

# Run individual devices
npx ts-node electric_car.ts
npx ts-node charging_station.ts
npx ts-node parking_meter.ts
npx ts-node energy_sensor.ts

# Run full economy simulation
npx ts-node simulate_all.ts
```

---

## Demo Mode

Click **"Run Machine Economy Simulation"** on the dashboard to trigger the full device-to-device payment sequence:

1. **Electric Car → Charging Station** (0.50 USDCx)
2. **Charging Station → Energy Sensor** (0.03 USDCx)
3. **Electric Car → Parking Meter** (0.10 USDCx)

Live activity logs display each step in real-time via WebSocket.

---

## API Endpoints

### Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all machine services |
| GET | `/api/activities` | Get device activity log |
| GET | `/api/payments/history` | Get payment history |
| POST | `/api/simulation/run` | Run economy simulation |
| POST | `/api/reset` | Clear all data |
| GET | `/api/health` | Health check |

### Services (x402-protected)

| Method | Endpoint | Price |
|--------|----------|-------|
| POST | `/api/services/charge/start` | 0.50 USDCx |
| POST | `/api/services/parking/pay` | 0.10 USDCx |
| GET | `/api/services/energy/price` | 0.03 USDCx |
| GET | `/api/services/weather` | 0.02 USDCx |

### x402 Payment Headers

```
X-Payment-TxId: <stacks-transaction-id>
```

---

## x402 Protocol Implementation

The x402 middleware intercepts requests and checks for payment:

```
Request → x402 Middleware → Payment Check
                              │
                    No Payment? → 402 Payment Required
                              │
                    Has Payment? → Verify TX → Execute Service → Response
```

### 402 Response Example

```json
{
  "status": 402,
  "message": "Payment Required",
  "service": {
    "id": "ev-charging",
    "name": "EV Charging Station",
    "price": 0.5,
    "currency": "USDCx"
  },
  "paymentInstructions": {
    "version": "x402-1.0",
    "network": "testnet",
    "receiver": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "amount": 0.5,
    "currency": "USDCx",
    "contract": {
      "address": "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
      "name": "token-usdcx"
    },
    "memo": "x402:ev-charging:1710000000000",
    "expiresAt": 1710000300000
  }
}
```

---

## Tech Stack

- **Frontend:** Next.js, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, WebSocket
- **Blockchain:** Stacks (Testnet)
- **Protocol:** x402
- **Payments:** USDCx, sBTC
- **Smart Contracts:** Clarity (optional)

---

## Features

- [x] IoT Device Marketplace dashboard
- [x] x402 payment middleware
- [x] HTTP 402 Payment Required flow
- [x] Payment verification
- [x] Simulated IoT device scripts
- [x] Device-to-device economy simulation
- [x] Real-time WebSocket activity feed
- [x] Payment history tracking
- [x] Architecture diagram
- [x] Demo mode with one-click simulation
- [x] Clarity smart contract (optional)

---

## License

MIT

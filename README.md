# MachinaFi — Decentralized Payment Network for the Machine Economy

> _"The internet gave machines a voice. Blockchain gives machines a wallet."_

**MachinaFi** is a fully autonomous IoT machine-to-machine (M2M) payment network built on the **Stacks blockchain** using the **x402 HTTP Payment Required protocol**. Machines pay each other for services with zero human intervention, zero intermediaries, and immutable on-chain records.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Smart Contract](#smart-contract)
- [Services & Pricing](#services--pricing)
- [Device Simulations](#device-simulations)
- [API Reference](#api-reference)
- [Frontend Dashboard](#frontend-dashboard)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Live Demo Results](#live-demo-results)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)

---

## Overview

MachinaFi enables autonomous IoT devices to pay each other for services over the internet — without banks, without payment processors, without humans in the loop. It implements the **HTTP 402 Payment Required** standard backed by USDCx token transfers on the Stacks blockchain.

**Example flow:**

```
🚗 Electric Car
  ├─ Pays EV Charging Station:  0.50 USDCx  ──► ⚡ Charging Station
  └─ Pays Parking Meter:        0.10 USDCx  ──► 🅿️  Smart Parking Meter
⚡ Charging Station also:
  └─ Pays Energy Sensor:        0.03 USDCx  ──► 📊 Energy Price Sensor
```

All 3 payments happen in ~7 seconds. Zero humans. Zero intermediaries.

---

## How It Works

MachinaFi implements the **x402 payment flow** in 5 steps:

```
Step 1 ── IoT Device sends a service request
           POST /api/services/charge/start

Step 2 ── Server responds HTTP 402 Payment Required
           { amount: "0.5", currency: "USDCx", receiver: "ST..." }

Step 3 ── Device broadcasts USDCx token transfer on Stacks blockchain
           (signs and submits a real on-chain transaction)

Step 4 ── Server queries Hiro API to verify the transaction
           { status: "success", txId: "0xc4b5040f1ec910ce..." }

Step 5 ── Service is delivered + register-payment() called on Clarity contract
           (immutable on-chain log entry created)
```

End-to-end latency: **~5 seconds**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DEVICES LAYER                        │
│   🚗 Electric Car  ⚡ EV Charger  📊 Energy Sensor  🅿️ Meter │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP + WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                        BACKEND LAYER                        │
│   Express API  │  x402 Middleware  │  Payment Verifier      │
│   Service Routes  │  WebSocket Feed  │  Nonce Manager       │
└────────────────────────────┬────────────────────────────────┘
                             │ Hiro API + Stacks.js
┌────────────────────────────▼────────────────────────────────┐
│                      BLOCKCHAIN LAYER                       │
│   Stacks Testnet  │  USDCx Token  │  Clarity Smart Contract │
│   Contract: ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN       │
└─────────────────────────────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────┐
│                       FRONTEND LAYER                        │
│   Next.js Dashboard  │  Real-time Activity Log              │
│   Payment History  │  Architecture Diagram  │  Wallet UI    │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
payment/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── index.ts          # Server entry point (Express + WebSocket)
│   │   ├── config/           # App configuration (network, tokens, contract)
│   │   ├── middleware/
│   │   │   └── x402.ts       # HTTP 402 payment enforcement middleware
│   │   ├── routes/
│   │   │   ├── api.ts        # General API: services, activities, simulation
│   │   │   ├── payments.ts   # Payment verification & history
│   │   │   └── services.ts   # Paid machine services (charge, park, energy, weather)
│   │   ├── services/
│   │   │   ├── payment.ts    # Core payment logic + on-chain registration
│   │   │   ├── registry.ts   # Machine service registry
│   │   │   ├── nonce-manager.ts  # Concurrent nonce management
│   │   │   ├── simulation.ts # Full economy simulation runner
│   │   │   └── store.ts      # In-memory activity/payment store
│   │   └── types/            # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Next.js dashboard
│   └── src/
│       ├── app/              # App router (layout, page, globals)
│       ├── components/       # UI components
│       │   ├── ActivityLog.tsx
│       │   ├── ArchitectureDiagram.tsx
│       │   ├── Header.tsx
│       │   ├── PaymentHistory.tsx
│       │   ├── ServiceCard.tsx
│       │   ├── SimulationControls.tsx
│       │   └── WalletButton.tsx
│       ├── context/
│       │   └── WalletContext.tsx  # Wallet state management
│       └── lib/
│           ├── api.ts        # Backend API client
│           └── wallet.ts     # Stacks wallet integration
│
├── devices/                  # IoT device simulation scripts
│   ├── electric_car.ts       # EV payment client
│   ├── charging_station.ts   # Charging station service
│   ├── energy_sensor.ts      # Energy price data provider
│   ├── parking_meter.ts      # Parking reservation service
│   ├── simulate_all.ts       # Full multi-device simulation
│   └── helpers.ts            # Shared utilities
│
├── contracts/
│   └── machinenet-payment.clar  # Clarity smart contract
│
└── clarinet-project/         # Clarinet deployment & testing
    ├── Clarinet.toml
    ├── contracts/
    │   └── machinenet-payment.clar
    ├── deployments/
    │   └── default.testnet-plan.yaml
    └── settings/
        ├── Devnet.toml
        ├── Testnet.toml
        └── Mainnet.toml
```

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Blockchain       | Stacks (Testnet / Mainnet)                |
| Protocol         | x402 — HTTP 402 Payment Required          |
| Token            | USDCx (USD Coin on Stacks)                |
| Smart Contract   | Clarity (`register-payment`)              |
| Backend          | Node.js + Express + TypeScript            |
| Blockchain SDK   | `@stacks/transactions`, `@stacks/network` |
| Frontend         | Next.js 14 + Tailwind CSS                 |
| Real-time        | WebSocket (`ws`)                          |
| Contract Tooling | Clarinet                                  |
| Key Mgmt         | BIP32 + BIP39 (`@scure/bip32`, `bip39`)   |

---

## Smart Contract

The Clarity smart contract `machinenet-payment` records every payment immutably on the Stacks blockchain.

**Contract address:** `ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN.machinenet-payment`

### Key function: `register-payment`

```clarity
(define-public (register-payment
  (tx-id (string-ascii 64))
  (receiver principal)
  (amount uint)
  (service-id (string-ascii 32)))
```

Called automatically after every successful payment verification. Creates a permanent, tamper-proof audit log on the blockchain.

Explore live transactions:
[Hiro Explorer — machinenet-payment](https://explorer.hiro.so/address/ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN?chain=testnet)

---

## Services & Pricing

All services require an on-chain USDCx micropayment before access is granted.

| Service                | Endpoint                          | Price      | Returns                                                 |
| ---------------------- | --------------------------------- | ---------- | ------------------------------------------------------- |
| ⚡ EV Charging Station | `POST /api/services/charge/start` | 0.50 USDCx | `sessionId`, `powerOutput` (150kW), `duration` (45 min) |
| 🅿️ Smart Parking Meter | `POST /api/services/parking/pay`  | 0.10 USDCx | `spotNumber`, 1-hour reservation                        |
| 📊 Energy Price Sensor | `GET /api/services/energy/price`  | 0.03 USDCx | `pricePerKwh`, `region`, `trend`                        |
| 🌤️ Weather Sensor      | `GET /api/services/weather`       | 0.02 USDCx | `temperature`, `conditions`                             |

---

## Device Simulations

The `devices/` directory contains TypeScript scripts simulating autonomous IoT devices:

```bash
# Run individual devices
npx ts-node devices/electric_car.ts
npx ts-node devices/charging_station.ts
npx ts-node devices/energy_sensor.ts
npx ts-node devices/parking_meter.ts

# Run full multi-device economy simulation
npx ts-node devices/simulate_all.ts
```

The `simulate_all.ts` script runs the full scenario:

1. Electric car requests charging → Server returns HTTP 402 → Car pays 0.50 USDCx
2. Charging station requests energy price → Pays sensor 0.03 USDCx
3. Electric car reserves parking → Pays meter 0.10 USDCx
4. All 3 payments registered on-chain

---

## API Reference

### General

| Method | Path                  | Description                         |
| ------ | --------------------- | ----------------------------------- |
| `GET`  | `/api/health`         | Health check                        |
| `GET`  | `/api/services`       | List all available machine services |
| `GET`  | `/api/activities`     | Get device activity log             |
| `POST` | `/api/simulation/run` | Trigger full economy simulation     |
| `POST` | `/api/reset`          | Clear in-memory data                |

### Payments

| Method | Path                    | Description                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| `POST` | `/api/payments/verify`  | Verify a transaction (`txId`, `amount`, `currency`) |
| `GET`  | `/api/payments/history` | Get all payment history                             |
| `POST` | `/api/payments/refresh` | Re-check all pending transactions                   |

### Services (x402 Protected)

| Method | Path                         | Description               |
| ------ | ---------------------------- | ------------------------- |
| `POST` | `/api/services/charge/start` | Start EV charging session |
| `POST` | `/api/services/parking/pay`  | Reserve parking spot      |
| `GET`  | `/api/services/energy/price` | Get energy price data     |
| `GET`  | `/api/services/weather`      | Get weather data          |

### WebSocket

Connect to `ws://localhost:4000/ws` for real-time activity events:

```json
{ "type": "connected", "message": "Connected to MachinaFi live feed" }
{ "type": "activity", "data": { "device": "electric_car", "event": "payment_sent", ... } }
```

---

## Frontend Dashboard

The Next.js frontend provides a real-time control panel:

- **Service Cards** — available machine services with prices
- **Simulation Controls** — "Run Machine Economy Simulation" button
- **Activity Log** — live stream of device events via WebSocket
- **Payment History** — table of all on-chain payments (txId, amount, status)
- **Architecture Diagram** — visual overview of the system
- **Wallet Button** — connect a Stacks wallet

Run the frontend:

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- A Stacks testnet wallet with USDCx tokens
- [Clarinet](https://docs.hiro.so/clarinet) (for contract development)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd payment

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install device dependencies
cd ../devices && npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Fill in your values (see [Environment Variables](#environment-variables)).

### 3. Start the backend

```bash
cd backend
npm run dev
# Server starts at http://localhost:4000
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
# Dashboard at http://localhost:3000
```

### 5. Run the simulation

```bash
cd devices
npx ts-node simulate_all.ts
```

Or click **"Run Machine Economy Simulation"** in the dashboard.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=4000

# Stacks Network
STACKS_NETWORK=testnet

# Wallet that receives payments
PAYMENT_RECEIVER_ADDRESS=ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN

# Private key for simulation wallet (signing transactions)
# ⚠️  NEVER commit this to version control
SIM_PRIVATE_KEY=your_private_key_here
```

> **Security note:** Never expose `SIM_PRIVATE_KEY` in public repositories. Use environment secrets or a vault solution in production.

---

## Live Demo Results

All payments verified on Stacks Testnet:

| Payment     | Device           | Amount         | Status       |
| ----------- | ---------------- | -------------- | ------------ |
| EV Charging | Car → Station    | 0.50 USDCx     | ✅ Verified  |
| Energy Data | Station → Sensor | 0.03 USDCx     | ✅ Verified  |
| Parking     | Car → Meter      | 0.10 USDCx     | ✅ Verified  |
| **Total**   | 3 devices        | **0.63 USDCx** | **0 humans** |

- **40+ `register-payment` transactions** recorded on Hiro Explorer
- Nonce management: automatic sequential increment across concurrent M2M payments
- Simulation wallet: `ST7G2A38TAH8V4V0C9K4XVTA4VYW35WTY43P2SQY`

---

## Use Cases

### Smart City — EV Charging

An electric vehicle autonomously pays the charging network as it plugs in. No app, no card, no human.

### Energy Trading

A solar panel owner's smart meter sells excess energy to neighbors directly, per kilowatt-hour, settled on-chain in real time.

### Sensor Data Marketplace

IoT sensors expose their data as paid micropayment APIs. Any device can query weather, energy price, or environmental data for fractions of a cent per request.

### Comparison

| Feature         | Traditional Payment | MachineNet        |
| --------------- | ------------------- | ----------------- |
| Settlement Time | Minutes / Hours     | ~5 Seconds        |
| Minimum Amount  | $1+                 | $0.001            |
| Intermediary    | Bank + Processor    | None              |
| Human Required  | Yes                 | No                |
| Audit Trail     | Private DB          | Public Blockchain |
| Trust Model     | Centralized         | Trustless         |
| Availability    | Business Hours      | 24 / 7 / 365      |

---

## Roadmap

| Phase      | Milestone                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| ✅ Phase 1 | x402 protocol + Stacks integration, 4-device simulation, Clarity contract |
| ✅ Phase 2 | Next.js dashboard, WebSocket live feed, payment history                   |
| ✅ Phase 3 | USDCx token transfers — live on Stacks Testnet                            |
| 🔲 Phase 4 | Stacks Mainnet deployment, production environment                         |
| 🔲 Phase 5 | SDK / npm package for IoT device developers                               |
| 🔲 Phase 6 | Hardware pilot — real EV charger integration                              |
| 🔲 Phase 7 | Multi-token support (STX, sBTC)                                           |

---

## License

MIT

---

## Author

Built for the **Stacks x402 Hackathon**.  
Powered by Stacks blockchain, x402 protocol, and the vision of a Machine Economy.

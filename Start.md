Build a full-stack hackathon project called "MachineNet – IoT Machine Economy on Stacks".

Goal
Create a decentralized IoT payment network where machines can automatically pay other machines for services using the x402 payment protocol on Stacks.

The project should simulate an economy where IoT devices interact and pay each other for services.

Technology Stack

Frontend
Next.js
TypeScript
TailwindCSS

Backend
Node.js
Express

Blockchain / Payments
Stacks blockchain
x402 payment protocol
Support payments using USDCx or sBTC

Wallet integration
Leather Wallet or Xverse

Project Structure

machinenet/
│
├─ frontend/
│ Next.js dashboard
│
├─ backend/
│ Express server
│ x402 middleware
│
├─ devices/
│ simulated IoT device scripts
│
└─ contracts/
Clarity contracts (optional)

Core Concept

Machines offer services.
Other machines must pay to access those services.

All services require HTTP 402 Payment Required responses until payment is completed.

Example Machine Services

1. EV Charging Station

Endpoint
POST /charge/start

Price
0.5 USDCx

Flow
Electric vehicle requests charging
Server returns 402 payment required
Vehicle pays using x402
Charging session starts

2. Smart Parking Meter

Endpoint
POST /parking/pay

Price
0.1 USDCx per hour

Flow
Car requests parking
Parking meter requires payment
After payment parking is activated

3. Energy Price Sensor

Endpoint
GET /energy/price

Price
0.03 USDCx

Charging stations use this API to determine electricity price.

4. Weather Sensor

Endpoint
GET /weather

Price
0.02 USDCx

Device-to-Device Economy Simulation

Create simulated IoT devices:

devices/electric_car.ts
devices/charging_station.ts
devices/parking_meter.ts
devices/energy_sensor.ts

Simulation Flow

Electric car requests charging
Charging station requires payment
Car pays using x402
Charging starts

Charging station then buys energy price data from energy sensor
Energy sensor requires payment
Charging station pays and receives data

Electric car also pays parking meter

x402 Payment Flow

Client requests service

Example request
POST /charge/start

Server responds

HTTP 402 Payment Required

Response includes payment instructions for USDCx or sBTC.

Client submits payment on Stacks.

Server verifies transaction and unlocks the service.

Backend Requirements

Express API server
x402 payment middleware
payment verification module
service execution handlers

Example middleware flow

request → payment check → verify transaction → execute service → return response

Frontend Dashboard

Next.js interface that shows:

Available machine services
Service price
Device activity
Payment history
Simulation control

Simulation Feature

Include a button:

Run Machine Economy Simulation

When clicked it automatically runs:

Electric Car → Charging Station payment
Charging Station → Energy Sensor payment
Electric Car → Parking Meter payment

Dashboard should display live logs of device activity.

Example logs

Electric Car requesting charging
Charging Station requires payment
Payment received (USDCx)
Charging session started
Charging Station requesting energy price
Payment sent
Energy data received

Bonus Features (optional)

WebSocket live event stream
Service usage analytics
Machine economy visualization graph
Device balance tracking

Goal of the Demo

Demonstrate how x402 enables a machine-to-machine economy where autonomous devices can buy and sell services using micropayments on Stacks.

Hackathon Deliverables

Working demo
Clear README
Architecture diagram
IoT simulation scripts
Frontend dashboard

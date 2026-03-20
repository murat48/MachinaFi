"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ServiceCard from "@/components/ServiceCard";
import ActivityLog from "@/components/ActivityLog";
import PaymentHistory from "@/components/PaymentHistory";
import SimulationControls from "@/components/SimulationControls";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import {
  fetchServices,
  fetchActivities,
  fetchPayments,
  refreshPayments,
  runSimulation,
  resetData,
  createWebSocket,
} from "@/lib/api";
import { MachineService, DeviceActivity, PaymentRecord } from "@/types";

export default function Home() {
  const [services, setServices] = useState<MachineService[]>([]);
  const [activities, setActivities] = useState<DeviceActivity[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "activity" | "architecture"
  >("dashboard");

  const loadData = useCallback(async () => {
    try {
      const [svcRes, actRes, payRes] = await Promise.all([
        fetchServices(),
        fetchActivities(),
        fetchPayments(),
      ]);
      setServices(svcRes.services || []);
      setActivities(actRes.activities || []);
      setPayments(payRes.payments || []);
    } catch {
      // Backend might not be running yet
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh payment statuses every 15s (pending → verified)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const payRes = await refreshPayments();
        setPayments(payRes.payments || []);
      } catch {
        // Backend might not be running
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket for live activity feed
  useEffect(() => {
    let ws: WebSocket | null = null;
    let destroyed = false;

    function connect() {
      ws = createWebSocket();
      if (!ws) return;

      ws.onmessage = (event) => {
        if (destroyed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "activity") {
            setActivities((prev) => [...prev, msg.data]);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!destroyed) {
          // Reconnect after 3s if the connection drops
          setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws?.close();
    }

    connect();

    return () => {
      destroyed = true;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, []);

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      await runSimulation();
      // Refresh data after simulation
      await loadData();
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetData();
      setActivities([]);
      setPayments([]);
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? "bg-brand-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-white">
              {services.length}
            </div>
            <div className="text-xs text-gray-400">Available Services</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-green-400">
              {payments.filter((p) => p.status === "verified").length}
            </div>
            <div className="text-xs text-gray-400">Verified Payments</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-brand-400">
              {payments
                .filter((p) => p.status === "verified")
                .reduce((s, p) => s + p.amount, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Total Volume (USDCx)</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {activities.length}
            </div>
            <div className="text-xs text-gray-400">Device Events</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2">
          <button
            className={tabClass("dashboard")}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={tabClass("activity")}
            onClick={() => setActiveTab("activity")}
          >
            Activity & Payments
          </button>
          <button
            className={tabClass("architecture")}
            onClick={() => setActiveTab("architecture")}
          >
            Architecture
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Simulation Controls */}
            <SimulationControls
              onRun={handleRunSimulation}
              onReset={handleReset}
              running={simulating}
            />

            {/* Services Grid */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">
                Machine Services Marketplace
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onActivity={loadData}
                  />
                ))}
              </div>
              {services.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-12 text-center">
                  <p className="text-gray-400">
                    Unable to load services. Make sure the backend is running on
                    port 4000.
                  </p>
                  <code className="mt-2 block text-xs text-gray-500">
                    cd backend && npm run dev
                  </code>
                </div>
              )}
            </div>

            {/* Recent Activity Preview */}
            {activities.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Recent Activity
                </h2>
                <ActivityLog activities={activities.slice(-10)} />
              </div>
            )}
          </div>
        )}

        {/* Activity & Payments Tab */}
        {activeTab === "activity" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityLog activities={activities} />
            <PaymentHistory payments={payments} />
          </div>
        )}

        {/* Architecture Tab */}
        {activeTab === "architecture" && <ArchitectureDiagram />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500">
        MachineNet — Built with x402 Protocol on Stacks Blockchain
      </footer>
    </div>
  );
}

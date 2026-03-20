"use client";

import { DeviceActivity } from "@/types";

interface Props {
  activities: DeviceActivity[];
}

const typeColors: Record<DeviceActivity["type"], string> = {
  info: "text-blue-400",
  request: "text-purple-400",
  payment: "text-yellow-400",
  response: "text-green-400",
  service: "text-brand-400",
  error: "text-red-400",
};

const typeIcons: Record<DeviceActivity["type"], string> = {
  info: "ℹ️",
  request: "📡",
  payment: "💳",
  response: "✅",
  service: "⚙️",
  error: "❌",
};

export default function ActivityLog({ activities }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Activity Log</h2>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">
          No activity yet. Run the simulation to see device interactions.
        </div>
      ) : (
        <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
          {[...activities].reverse().map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
            >
              <span className="mt-0.5 text-sm">{typeIcons[activity.type]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${typeColors[activity.type]}`}>
                    {activity.deviceName}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {activity.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface SubscriberDataPoint {
  date: string;
  new: number;
  total: number;
  churned: number;
}

export function SubscriberChart({ data }: { data: SubscriberDataPoint[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="date"
            stroke="#71717A"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717A"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181B",
              border: "1px solid #27272A",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#FAFAFA" }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Total Subscribers"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#totalGradient)"
          />
          <Area
            type="monotone"
            dataKey="new"
            name="New Subscribers"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#newGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NewSubscribersChart({ data }: { data: SubscriberDataPoint[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="date"
            stroke="#71717A"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717A"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181B",
              border: "1px solid #27272A",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#FAFAFA" }}
          />
          <Bar
            dataKey="new"
            name="New Subscribers"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


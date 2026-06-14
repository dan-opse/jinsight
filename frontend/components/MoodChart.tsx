"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface MoodPoint {
  date: string;
  mood_score: number;
}

export default function MoodChart({ data }: { data: MoodPoint[] }) {
  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  if (formatted.length === 0) {
    return (
      <p className="text-sm text-stone-400 py-8 text-center">
        No mood data yet — save a few entries first.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a8a29e" }} />
        <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: "#a8a29e" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
          formatter={(v) => [`${v}/10`, "Mood"]}
        />
        <Line
          type="monotone"
          dataKey="mood_score"
          stroke="#292524"
          strokeWidth={2}
          dot={{ r: 3, fill: "#292524" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

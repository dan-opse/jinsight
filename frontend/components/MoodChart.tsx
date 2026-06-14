import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MoodPoint } from "@/lib/types";

export default function MoodChart({ data, loading }: { data: MoodPoint[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-4 w-32 animate-pulse rounded bg-violet-50" />
      </div>
    );
  }

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-slate-400">
          No mood data yet — save a few entries first.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ede9fe" }}
          formatter={(v) => [`${v}/10`, "Mood"]}
        />
        <Line
          type="monotone"
          dataKey="mood_score"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ r: 3, fill: "#7c3aed" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

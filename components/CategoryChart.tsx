"use client";

import { useId, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Datum = { tag: string; total: number; solved: number };

const SOLVED_COLOR = "#f59e0b"; // amber-500
const TOTAL_COLOR = "rgba(161, 161, 170, 0.35)"; // zinc-400 @ 35%

function ToggleTotals({
  show,
  onChange,
}: {
  show: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={show}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-amber-500"
      />
      Show total available
    </label>
  );
}

function SolvedGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
      <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
    </linearGradient>
  );
}

export function CategoryChart({ data }: { data: Datum[] }) {
  const [showTotal, setShowTotal] = useState(false);
  const gradId = useId().replace(/:/g, "_");
  // Sort by solved (desc) so the most-practiced tags lead the chart;
  // re-rank when the user toggles totals on so the order still helps comparison.
  const sorted = [...data]
    .sort((a, b) => (showTotal ? b.total - a.total : b.solved - a.solved))
    .slice(0, 18);
  return (
    <div>
      <div className="flex justify-end mb-2">
        <ToggleTotals show={showTotal} onChange={setShowTotal} />
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
            <defs>
              <SolvedGradient id={`cat-${gradId}`} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.18)" />
            <XAxis
              dataKey="tag"
              angle={-40}
              textAnchor="end"
              interval={0}
              height={80}
              tick={{ fontSize: 11, fill: "currentColor" }}
              stroke="rgba(161,161,170,0.4)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              stroke="rgba(161,161,170,0.4)"
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(245,158,11,0.06)" }}
              contentStyle={{
                background: "rgba(24,24,27,0.95)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "0.5rem",
                color: "#fafafa",
              }}
              labelStyle={{ color: "#fafafa" }}
            />
            {showTotal && <Bar dataKey="total" fill={TOTAL_COLOR} radius={[4, 4, 0, 0]} />}
            <Bar dataKey="solved" fill={`url(#cat-${gradId})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DifficultyChart({
  data,
}: {
  data: { difficulty: string; total: number; solved: number }[];
}) {
  const [showTotal, setShowTotal] = useState(false);
  const gradId = useId().replace(/:/g, "_");
  return (
    <div>
      <div className="flex justify-end mb-2">
        <ToggleTotals show={showTotal} onChange={setShowTotal} />
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <SolvedGradient id={`diff-${gradId}`} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.18)" />
            <XAxis
              dataKey="difficulty"
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="rgba(161,161,170,0.4)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              stroke="rgba(161,161,170,0.4)"
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(245,158,11,0.06)" }}
              contentStyle={{
                background: "rgba(24,24,27,0.95)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "0.5rem",
                color: "#fafafa",
              }}
              labelStyle={{ color: "#fafafa" }}
            />
            {showTotal && <Bar dataKey="total" fill={TOTAL_COLOR} radius={[4, 4, 0, 0]} />}
            <Bar dataKey="solved" fill={`url(#diff-${gradId})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

void SOLVED_COLOR; // keep the constant exported intent without unused-var warnings

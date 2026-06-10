"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

const GRADIENT_ID_PREFIX = "sparkline-gradient-";

let counter = 0;
function nextId() {
  counter += 1;
  return `${GRADIENT_ID_PREFIX}${counter}`;
}

export function Sparkline({
  data,
  color = "#f59e0b",
  ariaLabel,
}: {
  data: number[];
  /** Stroke + gradient color (CSS color). */
  color?: string;
  ariaLabel?: string;
}) {
  const points = data.map((y, x) => ({ x, y }));
  const max = Math.max(0, ...data);
  const gradientId = nextId();
  return (
    <div
      className="w-full h-12 mt-3"
      role="img"
      aria-label={ariaLabel ?? "12-week activity trend"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Force a small headroom even when all values are 0 so the line doesn't sit on the bottom edge */}
          <YAxis hide domain={[0, Math.max(1, max)]} />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

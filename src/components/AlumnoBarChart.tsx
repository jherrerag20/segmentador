"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  label: string;
  score: number | null;
  p30: number;
  p70: number;
  color?: string;
};

export default function AlumnoBarChart({
  label,
  score,
  p30,
  p70,
  color = "#006699",
}: Props) {
  if (score == null) {
    return (
      <p className="text-xs text-neutral-500">
        No hay puntaje disponible para {label.toLowerCase()}.
      </p>
    );
  }

  const data = [{ name: label, score }];

  // Máximo dinámico para que quepan barras y líneas de percentil
  const maxVal = Math.max(score, p30, p70) + 5;

  return (
    <div className="w-full h-40 min-h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={false} axisLine={false} />
          <YAxis domain={[0, maxVal]} tick={{ fontSize: 10 }} />

          <Tooltip
            formatter={(value: number) => value.toFixed(1)}
            labelFormatter={() => label}
          />

          {/* Línea de percentil 30 */}
          <ReferenceLine
            y={p30}
            stroke="#f97316"
            strokeDasharray="4 4"
            label={{
              value: "P30",
              position: "insideTopRight",
              fontSize: 10,
              fill: "#f97316",
            }}
          />

          {/* Línea de percentil 70 */}
          <ReferenceLine
            y={p70}
            stroke="#22c55e"
            strokeDasharray="4 4"
            label={{
              value: "P70",
              position: "insideTopRight",
              fontSize: 10,
              fill: "#22c55e",
            }}
          />

          <Bar
            dataKey="score"
            fill={color}
            radius={[8, 8, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
// src/components/AlumnoRadarChart.tsx
"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = {
  extraversionScore: number | null;
  conscientiousnessScore: number | null;
  agreeablenessScore: number | null;
};

export default function AlumnoRadarChart({
  extraversionScore,
  conscientiousnessScore,
  agreeablenessScore,
}: Props) {
  const traits = [
    {
      key: "extraversion",
      label: "Extroversión",
      value: extraversionScore,
    },
    {
      key: "conscientiousness",
      label: "Responsabilidad",
      value: conscientiousnessScore,
    },
    {
      key: "agreeableness",
      label: "Amabilidad",
      value: agreeablenessScore,
    },
  ].filter((t) => t.value != null);

  if (traits.length === 0) {
    return (
      <p className="text-xs text-neutral-600">
        No hay puntajes suficientes para mostrar el mapa del perfil.
      </p>
    );
  }

  const data = traits.map((t) => ({
    trait: t.label,
    score: t.value as number,
  }));

  const maxVal = Math.max(...data.map((d) => d.score)) + 5;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="trait"
            tick={{ fontSize: 11 }}
          />
          <PolarRadiusAxis
        angle={30}
        domain={[0, maxVal]}
        tick={false}       // ← oculta los números
        axisLine={false}   // ← oculta la línea circular gruesa
        />
          <Tooltip
            formatter={(value: number) => value.toFixed(1)}
            labelFormatter={(label) => label}
          />
          <Radar
            name="Puntaje"
            dataKey="score"
            fill="#006699"
            fillOpacity={0.4}
            stroke="#006699"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
"use client";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART, ChartTooltip } from "./chart-tooltip";

export function SkillsRadar({
  data,
  compare,
  height = 260,
}: {
  data: { skill: string; value: number }[];
  compare?: { skill: string; value: number }[];
  height?: number;
}) {
  const merged = data.map((d, i) => ({
    skill: d.skill,
    current: d.value,
    previous: compare?.[i]?.value ?? null,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RRadarChart data={merged} outerRadius="72%">
        <PolarGrid stroke={CHART.grid} />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--ds-gray-700)" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {compare ? (
          <Radar
            name="Previous"
            dataKey="previous"
            stroke={CHART.axis}
            fill={CHART.axis}
            fillOpacity={0.08}
            strokeWidth={1}
            isAnimationActive={false}
          />
        ) : null}
        <Radar
          name="Now"
          dataKey="current"
          stroke={CHART.accent}
          fill={CHART.accent}
          fillOpacity={0.18}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
        <Tooltip content={<ChartTooltip />} />
      </RRadarChart>
    </ResponsiveContainer>
  );
}

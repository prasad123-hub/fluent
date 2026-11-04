"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, CHART, ChartTooltip } from "./chart-tooltip";

export interface TrendPoint {
  x: string;
  [key: string]: string | number | null;
}

export interface TrendSeries {
  key: string;
  name: string;
  color?: string;
}

/** Thin line with gradient area fill (single series) or multiple thin lines. */
export function TrendChart({
  data,
  series,
  height = 220,
  unit = "",
  domain,
  yTicks,
  area = true,
  format,
  labelFormat,
}: {
  data: TrendPoint[];
  series: TrendSeries[];
  height?: number;
  unit?: string;
  domain?: [number | "auto", number | "auto"];
  yTicks?: number[];
  area?: boolean;
  format?: (v: number) => string;
  labelFormat?: (l: string | number) => string;
}) {
  const single = series.length === 1 && area;
  const Comp = single ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Comp data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? CHART.accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color ?? CHART.accent} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
        <XAxis dataKey="x" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          domain={domain ?? ["auto", "auto"]}
          ticks={yTicks}
          width={48}
        />
        <Tooltip
          content={<ChartTooltip unit={unit} format={format} labelFormat={labelFormat} />}
          cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
        />
        {series.map((s) =>
          single ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? CHART.accent}
              strokeWidth={1.5}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? CHART.accent}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ),
        )}
      </Comp>
    </ResponsiveContainer>
  );
}

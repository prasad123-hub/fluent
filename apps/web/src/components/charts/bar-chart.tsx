"use client";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, CHART, ChartTooltip } from "./chart-tooltip";

export function Bars({
  data,
  xKey = "x",
  yKey = "value",
  name = "Value",
  height = 200,
  unit = "",
  color = CHART.accent,
  colors,
  scoreTone = false,
  horizontal = false,
  format,
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  name?: string;
  height?: number;
  unit?: string;
  color?: string;
  colors?: (d: Record<string, string | number>, i: number) => string;
  /** Serialisable alternative to `colors` for server components: colour bars by score thresholds. */
  scoreTone?: boolean;
  /** Serialisable alternative: highlight the first bar in the accent colour, the rest monochrome. */
  highlightFirst?: boolean;
  horizontal?: boolean;
  format?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 8, left: horizontal ? 8 : -18, bottom: 0 }}
        barCategoryGap={horizontal ? 6 : "30%"}
      >
        <CartesianGrid
          vertical={horizontal}
          horizontal={!horizontal}
          stroke={CHART.grid}
          strokeDasharray="3 3"
        />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={110}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
          </>
        )}
        <Tooltip
          content={<ChartTooltip unit={unit} format={format} />}
          cursor={{ fill: "var(--ds-gray-200)" }}
        />
        <Bar
          dataKey={yKey}
          name={name}
          radius={[3, 3, 0, 0]}
          fill={color}
          isAnimationActive={false}
          maxBarSize={28}
        >
          {colors || scoreTone
            ? data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    colors
                      ? colors(d, i)
                      : Number(d[yKey]) >= 75
                        ? CHART.green
                        : Number(d[yKey]) >= 60
                          ? CHART.accent
                          : CHART.amber
                  }
                />
              ))
            : null}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}

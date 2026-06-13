// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: Renders the output of the render_chart tool inside the chat
 * transcript. Bar, line, area and pie charts via Recharts, themed with
 * design tokens.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartSpec = {
  type: 'bar' | 'line' | 'area' | 'pie'
  title: string
  xKey: string
  series: { key: string; label: string }[]
  data: Record<string, string | number>[]
}

const SERIES_COLORS = [
  'var(--color-brand)',
  'var(--color-muted-foreground)',
  'var(--color-foreground)',
  'var(--color-destructive)',
]

export function ChartMessage({ spec }: { spec: ChartSpec }) {
  const axisStyle = {
    fontSize: 11,
    fill: 'var(--color-muted-foreground)',
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-card">
      <figcaption className="border-b border-border/50 px-3 py-2 text-[12px] font-medium text-foreground">
        {spec.title}
      </figcaption>
      <div className="h-64 w-full p-3">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === 'pie' ? (
            <PieChart>
              <Pie
                data={spec.data}
                dataKey={spec.series[0].key}
                nameKey={spec.xKey}
                innerRadius="45%"
                outerRadius="80%"
                stroke="var(--color-border)"
              >
                {spec.data.map((_, i) => (
                  <Cell
                    // biome-ignore lint/suspicious/noArrayIndexKey: static chart
                    key={i}
                    fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ) : spec.type === 'line' ? (
            <LineChart data={spec.data}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} tick={axisStyle} />
              <YAxis tick={axisStyle} width={40} />
              <Tooltip />
              {spec.series.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 11 }} />
              )}
              {spec.series.map((s, i) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          ) : spec.type === 'area' ? (
            <AreaChart data={spec.data}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} tick={axisStyle} />
              <YAxis tick={axisStyle} width={40} />
              <Tooltip />
              {spec.series.map((s, i) => (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={spec.data}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} tick={axisStyle} />
              <YAxis tick={axisStyle} width={40} />
              <Tooltip />
              {spec.series.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 11 }} />
              )}
              {spec.series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

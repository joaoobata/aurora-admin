"use client"

import { Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, ComposedChart, CartesianGrid, Legend } from "recharts"

interface OverviewChartProps {
  data: {
    name: string;
    views: number;
    likes: number;
    uploads: number;
  }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.18}/>
            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis
          yAxisId="left"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <Tooltip 
            cursor={{fill: 'transparent'}} 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
            labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
            formatter={(value: unknown) => Number(value).toLocaleString()}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="views"
          name="Visualizações"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorViews)"
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="likes"
          name="Curtidas"
          stroke="#ec4899"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorLikes)"
        />
        <Bar
          yAxisId="right"
          dataKey="uploads"
          name="Vídeos Postados"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
          barSize={20}
          opacity={0.8}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

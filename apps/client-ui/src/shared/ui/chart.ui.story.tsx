import type { Meta, StoryObj } from "@storybook/react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./chart.ui";

const data = [
  { t: "09:00", cpu: 28 },
  { t: "09:30", cpu: 42 },
  { t: "10:00", cpu: 36 },
  { t: "10:30", cpu: 58 },
  { t: "11:00", cpu: 44 },
];

const config = {
  cpu: { label: "CPU %", color: "hsl(var(--chart-1, 220 70% 50%))" },
} satisfies ChartConfig;

const meta: Meta<typeof ChartContainer> = {
  title: "Shared/UI/Chart",
  component: ChartContainer,
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChartContainer>;

export const AreaExample: Story = {
  render: () => (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="t" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(v) => `${Number(v).toFixed(1)}%`} />}
        />
        <Area
          dataKey="cpu"
          type="monotone"
          stroke="var(--color-cpu)"
          fill="var(--color-cpu)"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  ),
};

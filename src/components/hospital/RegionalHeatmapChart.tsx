import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartTooltip } from 'recharts';
import { Hospital, getHospitalStatus } from '@/data/hospitals';

interface RegionalHeatmapChartProps {
  hospitals: Hospital[];
  regionLabel: string;
}

// Generate hourly demand pattern data
function generateHourlyData() {
  const basePattern: Record<number, number> = {
    0: 45, 1: 35, 2: 30, 3: 25, 4: 20, 5: 20,
    6: 25, 7: 35, 8: 50, 9: 65, 10: 75, 11: 80,
    12: 75, 13: 70, 14: 70, 15: 65, 16: 60, 17: 65,
    18: 75, 19: 85, 20: 90, 21: 85, 22: 70, 23: 55,
  };

  return Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}`,
    label: `${hour}시`,
    demand: basePattern[hour] ?? 50,
  }));
}

const getBarColor = (demand: number): string => {
  if (demand >= 80) return 'hsl(0, 70%, 55%)';
  if (demand >= 60) return 'hsl(30, 80%, 55%)';
  if (demand >= 40) return 'hsl(45, 80%, 55%)';
  return 'hsl(150, 50%, 50%)';
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-foreground">{d.label}</p>
      <p className="text-[11px] text-muted-foreground">
        예상 부하: <span className="font-bold text-foreground">{d.demand}%</span>
      </p>
    </div>
  );
};

const RegionalHeatmapChart = ({ hospitals, regionLabel }: RegionalHeatmapChartProps) => {
  const hourlyData = useMemo(() => generateHourlyData(), []);

  const statusSummary = useMemo(() => {
    let saturated = 0;
    let available = 0;
    hospitals.forEach(h => {
      const s = getHospitalStatus(h);
      if (s === 'unavailable') saturated++;
      else if (s === 'available') available++;
    });
    return { saturated, available, limited: hospitals.length - saturated - available };
  }, [hospitals]);

  const currentHour = new Date().getHours();

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-foreground">{regionLabel}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 font-medium">
          포화 {statusSummary.saturated}곳
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 font-medium">
          여유 {statusSummary.available}곳
        </span>
        {statusSummary.limited > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 font-medium">
            혼잡 {statusSummary.limited}곳
          </span>
        )}
      </div>

      {/* Heatmap Bar Chart */}
      <div className="h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval={2}
              tickFormatter={(v) => `${v}시`}
            />
            <YAxis hide domain={[0, 100]} />
            <RechartTooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="demand" radius={[2, 2, 0, 0]} maxBarSize={12}>
              {hourlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.demand)}
                  opacity={index === currentHour ? 1 : 0.6}
                  stroke={index === currentHour ? 'hsl(var(--foreground))' : 'none'}
                  strokeWidth={index === currentHour ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-muted-foreground text-center">
        ▲ 현재 시간 강조 · 시간대별 예상 응급실 부하
      </p>
    </div>
  );
};

export default RegionalHeatmapChart;

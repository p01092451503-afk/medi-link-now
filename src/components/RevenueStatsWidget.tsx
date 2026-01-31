import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { DrivingLog } from "@/hooks/useDrivingLogs";
import { TrendingUp, AlertCircle, Banknote, CreditCard, Building2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface RevenueStatsWidgetProps {
  logs: DrivingLog[];
  currentMonth: Date;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: "hsl(142, 76%, 36%)", // Green
  card: "hsl(217, 91%, 60%)", // Blue
  transfer: "hsl(262, 83%, 58%)", // Purple
  unpaid: "hsl(0, 84%, 60%)", // Red
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
  unpaid: "미수금",
};

const chartConfig: ChartConfig = {
  revenue: {
    label: "매출",
    color: "hsl(var(--primary))",
  },
  cash: {
    label: "현금",
    color: PAYMENT_METHOD_COLORS.cash,
  },
  card: {
    label: "카드",
    color: PAYMENT_METHOD_COLORS.card,
  },
  transfer: {
    label: "계좌이체",
    color: PAYMENT_METHOD_COLORS.transfer,
  },
  unpaid: {
    label: "미수금",
    color: PAYMENT_METHOD_COLORS.unpaid,
  },
};

const RevenueStatsWidget = ({ logs, currentMonth }: RevenueStatsWidgetProps) => {
  // Calculate monthly total revenue
  const monthlyTotalRevenue = useMemo(() => {
    return logs.reduce((sum, log) => sum + (log.revenue_amount || 0), 0);
  }, [logs]);

  // Calculate daily revenue data for bar chart
  const dailyRevenueData = useMemo(() => {
    const dailyMap: Record<number, number> = {};
    
    logs.forEach((log) => {
      if (log.revenue_amount) {
        const day = new Date(log.date).getDate();
        dailyMap[day] = (dailyMap[day] || 0) + log.revenue_amount;
      }
    });

    // Generate data for current month
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      revenue: dailyMap[i + 1] || 0,
    }));
  }, [logs, currentMonth]);

  // Calculate payment method distribution for pie chart
  const paymentMethodData = useMemo(() => {
    const methodMap: Record<string, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      unpaid: 0,
    };

    logs.forEach((log) => {
      if (log.revenue_amount && log.payment_method) {
        methodMap[log.payment_method] += log.revenue_amount;
      }
    });

    return Object.entries(methodMap)
      .filter(([_, value]) => value > 0)
      .map(([method, value]) => ({
        name: PAYMENT_METHOD_LABELS[method] || method,
        value,
        method,
        fill: PAYMENT_METHOD_COLORS[method],
      }));
  }, [logs]);

  // Get unpaid logs
  const unpaidLogs = useMemo(() => {
    return logs.filter((log) => log.payment_method === "unpaid" && log.revenue_amount);
  }, [logs]);

  const totalUnpaid = useMemo(() => {
    return unpaidLogs.reduce((sum, log) => sum + (log.revenue_amount || 0), 0);
  }, [unpaidLogs]);

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Monthly Total Revenue Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" />
          <p className="text-sm opacity-80">이번 달 누적 매출</p>
        </div>
        <p className="text-4xl font-bold">
          ₩{monthlyTotalRevenue.toLocaleString()}
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
          <span>총 {logs.filter(l => l.revenue_amount).length}건</span>
          <span>
            평균 ₩
            {logs.filter(l => l.revenue_amount).length > 0
              ? Math.round(
                  monthlyTotalRevenue / logs.filter(l => l.revenue_amount).length
                ).toLocaleString()
              : 0}
            /건
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Revenue Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            일별 매출
          </h3>
          <div className="h-[200px]">
            {dailyRevenueData.some(d => d.revenue > 0) ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${value}일`}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                      width={40}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatCurrency(value), "매출"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                매출 데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            결제 수단별 비율
          </h3>
          <div className="h-[200px]">
            {paymentMethodData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                결제 데이터가 없습니다
              </div>
            )}
          </div>
          {/* Legend */}
          {paymentMethodData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {paymentMethodData.map((item) => (
                <div key={item.method} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unpaid List */}
      {unpaidLogs.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              미수금 내역
            </h3>
            <span className="text-lg font-bold text-red-600">
              총 ₩{totalUnpaid.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {unpaidLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-100"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {log.hospital_name || log.end_location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString("ko-KR")}
                    {log.patient_name && ` · ${log.patient_name}`}
                  </p>
                </div>
                <span className="font-bold text-red-600">
                  ₩{(log.revenue_amount || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RevenueStatsWidget;

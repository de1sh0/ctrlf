import { TrendingUp, TrendingDown, ArrowRightLeft, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";

const StatsCards = () => {
  const now = new Date();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => statsApi.getMonthly(now.getMonth() + 1, now.getFullYear()),
  });

  const cards = [
    {
      label: "TOTAL SPENT",
      value: isLoading ? "..." : `₹${stats?.total_spent.toLocaleString("en-IN") ?? 0}`,
      sub: "This month",
      trend: "up",
      icon: TrendingUp,
      accent: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "REMAINING",
      value: isLoading ? "..." : `₹${stats?.remaining.toLocaleString("en-IN") ?? 0}`,
      sub: "Budget left",
      trend: "down",
      icon: TrendingDown,
      accent: "from-orange-100/40 to-amber-50/30",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      label: "TRANSACTIONS",
      value: isLoading ? "..." : `${stats?.transaction_count ?? 0}`,
      sub: `${stats?.auto_synced_count ?? 0} auto-synced`,
      trend: "neutral",
      icon: ArrowRightLeft,
      accent: "from-blue-100/30 to-sky-50/20",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "DAILY AVERAGE",
      value: isLoading ? "..." : `₹${stats?.daily_average.toLocaleString("en-IN") ?? 0}`,
      sub: `Top: ${stats?.top_category ?? "N/A"}`,
      trend: "down",
      icon: BarChart3,
      accent: "from-primary/10 to-emerald-50/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((stat, i) => (
        <div
          key={stat.label}
          className={`glass-card-hover rounded-2xl p-5 relative overflow-hidden animate-in stagger-${i + 1}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} pointer-events-none`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="label-uppercase">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="stat-value text-foreground">{stat.value}</p>
            <p className="text-xs mt-2 text-muted-foreground flex items-center gap-1">
              {stat.trend === "up" && <span className="text-primary font-semibold">↑</span>}
              {stat.trend === "down" && <span className="text-primary font-semibold">↓</span>}
              {stat.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
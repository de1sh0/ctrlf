import { useExpenses } from "@/hooks/useExpenses";

const DailySpending = () => {
  const { expenses } = useExpenses();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Build daily totals from real expenses
  const dailyMap = expenses
    .filter((e) => e.type === "debit")
    .reduce((acc, e) => {
      acc[e.date] = acc[e.date] || { amount: 0, txns: 0 };
      acc[e.date].amount += e.amount;
      acc[e.date].txns += 1;
      return acc;
    }, {} as Record<string, { amount: number; txns: number }>);

  // Get all days in current month that have data
  const days = Object.entries(dailyMap)
    .filter(([date]) => {
      const d = new Date(date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const avg = days.length > 0
    ? Math.round(days.reduce((s, d) => s + d.amount, 0) / days.length)
    : 0;

  const max = days.length > 0
    ? Math.max(...days.map((d) => d.amount))
    : 1;

  if (days.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-in stagger-4">
        <h3 className="text-lg font-bold text-foreground mb-1">Daily spending</h3>
        <p className="text-[13px] text-muted-foreground">No data this month yet</p>
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <p className="text-3xl mb-2">📅</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-in stagger-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Daily spending — {now.toLocaleDateString("en-IN", { month: "long" })}
          </h3>
          <p className="text-[13px] text-muted-foreground">
            Average ₹{avg.toLocaleString("en-IN")}/day
          </p>
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            Under avg
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" />
            Over avg
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-0 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {days.map((day) => {
          const isOver = day.amount > avg;
          const barWidth = Math.min((day.amount / max) * 100, 100);
          return (
            <div
              key={day.date}
              className="flex items-center gap-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/20 -mx-2 px-2 rounded-lg transition-colors duration-200"
            >
              <div className="w-14 flex-shrink-0">
                <p className="text-[13px] font-semibold text-foreground">{day.date}</p>
                <p className="text-[10px] text-muted-foreground">{day.txns} txns</p>
              </div>
              <div className="flex-1 h-2.5 bg-muted/40 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 w-px bg-foreground/15 z-10"
                  style={{ left: `${(avg / max) * 100}%` }}
                />
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isOver
                      ? "bg-gradient-to-r from-red-400 to-orange-400"
                      : "bg-gradient-to-r from-primary to-primary/60"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className={`text-[13px] font-bold w-16 text-right tabular-nums ${isOver ? "text-destructive" : "text-foreground"}`}>
                ₹{day.amount.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailySpending;
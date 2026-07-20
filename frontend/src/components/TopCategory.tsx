import { Zap } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Food & Dining": "🍔",
  "Transport": "🚗",
  "Groceries": "🛒",
  "Shopping": "🛍️",
  "Entertainment": "🎬",
  "Health": "💊",
  "Education": "📚",
  "Bills & Utilities": "💡",
  "Other": "📦",
};

const TopCategory = () => {
  const { expenses } = useExpenses();

  const debitExpenses = expenses.filter((e) => e.type === "debit");
  const totalSpent = debitExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryMap = debitExpenses.reduce((acc, e) => {
    acc[e.category] = acc[e.category] || { amount: 0, count: 0 };
    acc[e.category].amount += e.amount;
    acc[e.category].count += 1;
    return acc;
  }, {} as Record<string, { amount: number; count: number }>);

  const topCategory = Object.entries(categoryMap)
    .sort((a, b) => b[1].amount - a[1].amount)[0];

  const topName    = topCategory?.[0] ?? "N/A";
  const topAmount  = topCategory?.[1].amount ?? 0;
  const topCount   = topCategory?.[1].count ?? 0;
  const topPct     = totalSpent > 0 ? ((topAmount / totalSpent) * 100).toFixed(1) : "0";
  const topEmoji   = CATEGORY_EMOJIS[topName] ?? "📦";

  const autoSynced = expenses.filter((e) => e.source === "auto").length;
  const total      = expenses.length;
  const autoPct    = total > 0 ? Math.round((autoSynced / total) * 100) : 0;
  const manual     = total - autoSynced;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">

      {/* Top Category */}
      <div className="glass-card-hover rounded-2xl p-6 relative overflow-hidden animate-in stagger-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative">
          <p className="label-uppercase mb-4">Top Category</p>
          {topCategory ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl shadow-[var(--shadow-sm)]">
                  {topEmoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-bold text-foreground">{topName}</h3>
                    <span className="text-2xl font-bold gradient-text">{topPct}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{topAmount.toLocaleString("en-IN")} · {topCount} transactions
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000"
                  style={{ width: `${topPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No expenses yet</p>
          )}
        </div>
      </div>

      {/* Auto-Captured */}
      <div className="glass-card-hover rounded-2xl p-6 relative overflow-hidden animate-in stagger-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative">
          <p className="label-uppercase mb-4">Auto-Captured</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-[var(--shadow-sm)]">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-foreground">
                  {autoSynced} / {total}
                </h3>
                <span className="text-2xl font-bold gradient-text">{autoPct}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                via Gmail · {manual} manual
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
              style={{ width: `${autoPct}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default TopCategory;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Trash2, Pencil } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";

const filterTabs = ["All", "Food & Dining", "Transport", "Groceries", "Shopping", "Medical"];

const groupByDate = (expenses: any[]) => {
  return expenses.reduce((acc, expense) => {
    const key = expense.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(expense);
    return acc;
  }, {} as Record<string, any[]>);
};

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `TODAY — ${d.toLocaleDateString("en-IN", { day: "numeric", month: "long" }).toUpperCase()}`;
  if (d.toDateString() === yesterday.toDateString()) return `YESTERDAY — ${d.toLocaleDateString("en-IN", { day: "numeric", month: "long" }).toUpperCase()}`;
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
};

const RecentTransactions = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const { expenses, isLoading, deleteExpense } = useExpenses();

  const filtered = activeFilter === "All"
    ? expenses
    : expenses.filter((e) => e.category === activeFilter);

  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="glass-card rounded-2xl p-6 animate-in stagger-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Recent transactions</h3>
          <p className="text-[13px] text-muted-foreground">{expenses.length} this month</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl text-[13px] border-border/60 hover:bg-accent/60">
          View all
        </Button>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 my-4 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-200 whitespace-nowrap ${
              activeFilter === tab
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-0">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        )}

        {!isLoading && expenses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p className="text-2xl mb-2">🧾</p>
            No transactions yet. Add your first expense!
          </div>
        )}

        {!isLoading && sortedDates.map((date) => (
          <div key={date}>
            <p className="label-uppercase mt-5 mb-3">{formatDateLabel(date)}</p>
            <div className="space-y-0">
              {grouped[date].map((item: any) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 py-3 border-b border-border/40 last:border-0 hover:bg-accent/30 -mx-2 px-2 rounded-xl transition-colors duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-lg flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
                    <p className="text-[11px] text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${item.type === "credit" ? "text-primary" : "text-foreground"}`}>
                      {item.type === "credit" ? "+" : "−"}₹{item.amount.toLocaleString("en-IN")}
                    </span>
                    {item.source === "auto" ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                        <Zap className="w-2.5 h-2.5" /> auto
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        manual
                      </span>
                    )}
                    {/* ACTION BUTTONS */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deleteExpense(item.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
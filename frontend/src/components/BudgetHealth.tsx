import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Check, X } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useBudgets } from "@/hooks/useBudgets";

const GRADIENTS: Record<string, string> = {
  "Food & Dining":    "from-amber-400 to-orange-400",
  "Transport":        "from-emerald-500 to-emerald-400",
  "Groceries":        "from-yellow-400 to-amber-400",
  "Shopping":         "from-blue-400 to-sky-400",
  "Entertainment":    "from-purple-400 to-pink-400",
  "Health":           "from-rose-400 to-red-400",
  "Bills & Utilities":"from-orange-400 to-yellow-400",
  "Education":        "from-cyan-400 to-blue-400",
  "Travel":           "from-sky-400 to-indigo-400",
  "Other":            "from-stone-400 to-stone-300",
};

const BudgetHealth = () => {
  const { expenses } = useExpenses();
  const { budgets, updateBudget } = useBudgets();
  const [editing, setEditing] = useState(false);
  const [draftLimits, setDraftLimits] = useState<Record<string, number>>({});

  const categorySpending = expenses
    .filter((e) => e.type === "debit")
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const handleEditStart = () => {
    const drafts: Record<string, number> = {};
    budgets.forEach((b) => { drafts[b.id] = b.limit; });
    setDraftLimits(drafts);
    setEditing(true);
  };

  const handleSave = () => {
    budgets.forEach((b) => {
      if (draftLimits[b.id] !== b.limit) {
        updateBudget({ id: b.id, limit: draftLimits[b.id] });
      }
    });
    setEditing(false);
  };

  const topBudgets = budgets.slice(0, 5);

  return (
    <div className="glass-card rounded-2xl p-6 animate-in stagger-3">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-foreground">Budget health</h3>
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="rounded-xl gap-1.5 h-8">
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="rounded-xl h-8">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleEditStart} variant="ghost" size="sm"
            className="rounded-xl text-muted-foreground hover:bg-accent/60 gap-1.5">
            <Settings2 className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {topBudgets.map((b) => {
          const spent = categorySpending[b.category] || 0;
          const limit = editing ? (draftLimits[b.id] ?? b.limit) : b.limit;
          const pct = Math.min((spent / limit) * 100, 100);
          const isOver = spent > limit * 0.85;
          const gradient = GRADIENTS[b.category] || "from-stone-400 to-stone-300";

          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-base">
                    {b.emoji}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{b.category}</span>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <span className={`text-sm font-bold tabular-nums ${isOver ? "text-destructive" : "text-foreground"}`}>
                    ₹{spent.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">of</span>
                  {editing ? (
                    <input
                      type="number"
                      value={draftLimits[b.id] ?? b.limit}
                      onChange={(e) => setDraftLimits(prev => ({
                        ...prev, [b.id]: Number(e.target.value)
                      }))}
                      className="w-20 text-xs text-right border border-border rounded-lg px-1.5 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      ₹{b.limit.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isOver ? "bg-gradient-to-r from-destructive to-red-400"
                           : `bg-gradient-to-r ${gradient}`
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {isOver && (
                <p className="text-xs text-destructive mt-1 font-medium">⚠️ Almost at limit</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetHealth;
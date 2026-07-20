import Sidebar from "@/components/Sidebar";
import { useExpenses } from "@/hooks/useExpenses";
import { useBudgets } from "@/hooks/useBudgets";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, PiggyBank, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

const Budgets = () => {
  const { expenses } = useExpenses();
  const { budgets, updateBudget } = useBudgets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLimit, setDraftLimit] = useState<number>(0);

  const categorySpending = expenses
    .filter((e) => e.type === "debit")
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent  = Object.values(categorySpending).reduce((a, b) => a + b, 0);

  const budgetItems = budgets.map((b) => ({
    ...b,
    spent: categorySpending[b.category] || 0,
    percentage: Math.min(((categorySpending[b.category] || 0) / b.limit) * 100, 100),
  }));

  const handleEditStart = (b: typeof budgetItems[0]) => {
    setEditingId(b.id);
    setDraftLimit(b.limit);
  };

  const handleSave = (id: string) => {
    updateBudget({ id, limit: draftLimit });
    setEditingId(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click the pencil icon on any category to edit its limit
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{Math.max(totalBudget - totalSpent, 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Budget list */}
        <div className="bg-card rounded-2xl border border-border/40 divide-y divide-border/40">
          {budgetItems.map((item) => (
            <div key={item.id} className="p-5 hover:bg-accent/20 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-sm font-bold ${item.percentage >= 85 ? "text-destructive" : "text-foreground"}`}>
                      ₹{item.spent.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground"> / </span>
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={draftLimit}
                        onChange={(e) => setDraftLimit(Number(e.target.value))}
                        className="w-24 text-sm border border-border rounded-lg px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        ₹{item.limit.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStart(item)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <Progress value={item.percentage} className="h-2 rounded-full" />

              {item.percentage >= 85 && (
                <p className="text-xs text-destructive mt-1.5 font-medium">
                  ⚠️ {item.percentage >= 100 ? "Budget exceeded!" : "Almost at limit"}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Budgets;
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/useExpenses";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "@/lib/api";

const CATEGORIES = [
  { label: "Food & Dining", emoji: "🍕" },
  { label: "Transport", emoji: "🚗" },
  { label: "Groceries", emoji: "🛒" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Entertainment", emoji: "🎬" },
  { label: "Health", emoji: "💊" },
  { label: "Bills & Utilities", emoji: "💡" },
  { label: "Education", emoji: "📚" },
  { label: "Travel", emoji: "✈️" },
  { label: "Personal Transfer", emoji: "👤" },
  { label: "Other", emoji: "📦" },
];

const getCategoryEmoji = (category: string) =>
  CATEGORIES.find((c) => c.label === category)?.emoji ?? "📦";

const Transactions = () => {
  const { expenses } = useExpenses();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category, emoji }: { id: string; category: string; emoji: string }) =>
      expensesApi.update(id, { category, emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setEditingId(null);
    },
  });

  const handleCategoryChange = (expenseId: string, category: string) => {
    const emoji = getCategoryEmoji(category);
    updateCategoryMutation.mutate({ id: expenseId, category, emoji });
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || e.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = [...new Set(expenses.map((e) => e.category))];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {expenses.length} total transactions
            </p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl border-border/60">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card border-border/60"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 px-4 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-lg flex-shrink-0">
                    {getCategoryEmoji(expense.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {editingId === expense.id ? (
                        <select
                          autoFocus
                          defaultValue={expense.category}
                          onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="text-xs h-7 px-2 rounded-lg bg-background border border-primary/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.label} value={c.label}>
                              {c.emoji} {c.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {expense.category} • {new Date(expense.date).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <button
                            id={`edit-category-${expense.id}`}
                            onClick={() => setEditingId(expense.id)}
                            title="Fix category — will be remembered for future transactions"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {expense.type === "credit" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-destructive" />
                    )}
                    <span className={`text-sm font-bold ${expense.type === "credit" ? "text-emerald-500" : "text-destructive"}`}>
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          💡 Hover over a transaction and click the ✏️ icon to fix its category. It will be remembered automatically next time.
        </p>
      </main>
    </div>
  );
};

export default Transactions;
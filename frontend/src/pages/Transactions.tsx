import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/useExpenses";

const categoryEmojis: Record<string, string> = {
  "Food & Dining": "🍕",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Bills: "📱",
  Health: "💊",
  Education: "📚",
  Travel: "✈️",
  Other: "📦",
};

const Transactions = () => {
  const { expenses } = useExpenses();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
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
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/60 flex items-center justify-center text-lg">
                    {categoryEmojis[expense.category] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {expense.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {expense.category} • {new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-sm font-bold text-destructive">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Transactions;
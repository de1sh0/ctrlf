import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useExpenses } from "@/hooks/useExpenses";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const categoryColors: Record<string, string> = {
  "Food & Dining": "hsl(38,90%,55%)",
  Transport: "hsl(220,60%,55%)",
  Shopping: "hsl(340,60%,50%)",
  Entertainment: "hsl(280,50%,55%)",
  Bills: "hsl(0,72%,55%)",
  Health: "hsl(152,35%,38%)",
  Education: "hsl(180,40%,45%)",
  Travel: "hsl(30,70%,50%)",
  Other: "hsl(25,10%,50%)",
};

const Categories = () => {
  const { expenses } = useExpenses();

  const categoryData = Object.keys(categoryEmojis).map((category) => {
    const catExpenses = expenses.filter((e) => e.category === category);
    const total = catExpenses.reduce((s, e) => s + e.amount, 0);
    return { category, emoji: categoryEmojis[category], total, count: catExpenses.length, color: categoryColors[category] };
  });

  const totalSpent = categoryData.reduce((s, c) => s + c.total, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize your expenses by category</p>
          </div>
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {categoryData.map((cat) => {
            const percentage = totalSpent > 0 ? ((cat.total / totalSpent) * 100).toFixed(1) : "0";
            return (
              <div
                key={cat.category}
                className="bg-card rounded-2xl border border-border/40 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${cat.color}15` }}
                    >
                      {cat.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat.category}</p>
                      <p className="text-xs text-muted-foreground">{cat.count} transactions</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-accent">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-bold text-foreground">
                    ₹{cat.total.toLocaleString("en-IN")}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                    {percentage}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, background: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Categories;

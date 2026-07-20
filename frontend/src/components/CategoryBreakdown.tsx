import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useExpenses } from "@/hooks/useExpenses";

const COLORS = [
  "hsl(35, 65%, 55%)",
  "hsl(152, 35%, 42%)",
  "hsl(50, 55%, 55%)",
  "hsl(210, 40%, 55%)",
  "hsl(25, 20%, 72%)",
  "hsl(280, 50%, 55%)",
  "hsl(0, 72%, 55%)",
];

const DOT_CLASSES = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-stone-400",
  "bg-purple-500",
  "bg-red-500",
];

const CategoryBreakdown = () => {
  const { expenses } = useExpenses();

  const debitExpenses = expenses.filter((e) => e.type === "debit");
  const totalSpent = debitExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryMap = debitExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      pct: totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7);

  const pieData = categories.map((c) => ({ value: parseFloat(c.pct) }));

  const totalDisplay = totalSpent >= 1000
    ? `₹${(totalSpent / 1000).toFixed(1)}k`
    : `₹${totalSpent}`;

  return (
    <div className="glass-card rounded-2xl p-6 animate-in stagger-4">
      <h3 className="text-lg font-bold text-foreground mb-0.5">By category</h3>
      <p className="text-[13px] text-muted-foreground mb-5">
        {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>

      {totalSpent === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">No spending data yet</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="relative w-52 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={3}
                    stroke="hsl(40, 40%, 99%)"
                    cornerRadius={4}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-foreground">{totalDisplay}</p>
                <p className="text-[11px] text-muted-foreground font-medium">total spent</p>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {categories.map((cat, i) => (
              <div
                key={cat.name}
                className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 hover:bg-accent/20 -mx-2 px-2 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${DOT_CLASSES[i % DOT_CLASSES.length]}`} />
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-muted-foreground tabular-nums">{cat.pct}%</span>
                  <span className="text-sm font-bold text-foreground w-20 text-right tabular-nums">
                    ₹{cat.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryBreakdown;
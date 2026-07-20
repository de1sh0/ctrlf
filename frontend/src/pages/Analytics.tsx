import Sidebar from "@/components/Sidebar";
import { useExpenses } from "@/hooks/useExpenses";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(152,35%,38%)", "hsl(38,90%,55%)", "hsl(0,72%,55%)", "hsl(220,60%,55%)", "hsl(280,50%,55%)", "hsl(180,40%,45%)", "hsl(30,70%,50%)", "hsl(340,60%,50%)"];

const Analytics = () => {
  const { expenses } = useExpenses();

  const debitExpenses = expenses.filter(e => e.type === "debit");

  // Category breakdown
  const categoryData = debitExpenses.reduce((acc, e) => {
    const existing = acc.find((c) => c.name === e.category);
    if (existing) existing.value += e.amount;
    else acc.push({ name: e.category, value: e.amount });
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // Daily spending (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayExpenses = debitExpenses.filter((e) => e.date === dateStr);
    const total = dayExpenses.reduce((s, e) => s + e.amount, 0);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), amount: total };
  });

  // Monthly trend
  const monthlyData = debitExpenses.reduce((acc, e) => {
    const month = new Date(e.date).toLocaleDateString("en-IN", { month: "short" });
    const existing = acc.find((m) => m.month === month);
    if (existing) existing.amount += e.amount;
    else acc.push({ month, amount: e.amount });
    return acc;
  }, [] as { month: string; amount: number }[]);

  const totalSpent = debitExpenses.reduce((s, e) => s + e.amount, 0);
  const avgDaily = totalSpent / 30;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Insights into your spending patterns</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-foreground">₹{totalSpent.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Daily</p>
            <p className="text-2xl font-bold text-foreground">₹{Math.round(avgDaily).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <p className="text-sm text-muted-foreground mb-1">Categories Used</p>
            <p className="text-2xl font-bold text-foreground">{categoryData.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-6">
          {/* Category Pie */}
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {categoryData.slice(0, 5).map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Bar */}
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(38,25%,90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(25,10%,50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(25,10%,50%)" />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                <Bar dataKey="amount" fill="hsl(152,35%,38%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-card rounded-2xl border border-border/40 p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(38,25%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(25,10%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(25,10%,50%)" />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
              <Line type="monotone" dataKey="amount" stroke="hsl(152,35%,38%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(152,35%,38%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
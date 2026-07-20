import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import TopCategory from "@/components/TopCategory";
import RecentTransactions from "@/components/RecentTransactions";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import BudgetHealth from "@/components/BudgetHealth";
import DailySpending from "@/components/DailySpending";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import { useExpenses } from "@/hooks/useExpenses";

const Index = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { addExpense } = useExpenses();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">
        <Header onAddExpense={() => setShowAddExpense(true)} />
        <StatsCards />
        <TopCategory />
        <div className="grid grid-cols-2 gap-5 mb-6">
          <RecentTransactions />
          <CategoryBreakdown />
        </div>
        <div className="grid grid-cols-2 gap-5 mb-8">
          <BudgetHealth />
          <DailySpending />
        </div>
      </main>
      <AddExpenseDialog
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdd={(expense) => {
          addExpense(expense);
          setShowAddExpense(false);
        }}
      />
    </div>
  );
};

export default Index;
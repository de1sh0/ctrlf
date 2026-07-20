import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi, CreateExpensePayload } from "@/lib/api";
import { toast } from "sonner";

export type { Expense } from "@/lib/api";

export const useExpenses = (month?: number, year?: number) => {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", month, year],
    queryFn: () => expensesApi.getAll(month, year),
    refetchInterval: 30000,
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateExpensePayload) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Expense added!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Expense deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpensePayload> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Expense updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const totalSpent = expenses
    .filter((e) => e.type === "debit")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = expenses
    .filter((e) => e.type === "debit")
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    expenses,
    isLoading,
    addExpense: addMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    updateExpense: updateMutation.mutate,
    totalSpent,
    categoryTotals,
  };
};
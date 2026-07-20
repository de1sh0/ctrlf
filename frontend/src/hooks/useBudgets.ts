import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api";
import { toast } from "sonner";

export const useBudgets = () => {
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number }) =>
      budgetsApi.update(id, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget updated!");
    },
    onError: () => toast.error("Failed to update budget"),
  });

  return {
    budgets,
    isLoading,
    updateBudget: updateMutation.mutate,
  };
};
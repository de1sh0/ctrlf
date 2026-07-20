import { useState } from "react";
import { X, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreateExpensePayload } from "@/lib/api";

const categories = [
  { label: "Food & Dining",    emoji: "🍕" },
  { label: "Transport",        emoji: "🚕" },
  { label: "Shopping",         emoji: "🛒" },
  { label: "Entertainment",    emoji: "🎬" },
  { label: "Bills & Utilities",emoji: "💡" },
  { label: "Health",           emoji: "💊" },
  { label: "Education",        emoji: "📚" },
  { label: "Other",            emoji: "📦" },
];

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (expense: CreateExpensePayload) => void;
}

const AddExpenseDialog = ({ open, onClose, onAdd }: AddExpenseDialogProps) => {
  const [description, setDescription]       = useState("");
  const [amount, setAmount]                 = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [date, setDate]                     = useState(new Date().toISOString().split("T")[0]);
  const [type, setType]                     = useState<"debit" | "credit">("debit");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || selectedCategory === null) {
      toast.error("Please fill in all fields");
      return;
    }
    const cat = categories[selectedCategory];
    onAdd({
      description,
      amount: parseFloat(amount),
      category: cat.label,
      emoji: cat.emoji,
      date,
      type,
    });
    // reset
    setDescription("");
    setAmount("");
    setSelectedCategory(null);
    setDate(new Date().toISOString().split("T")[0]);
    setType("debit");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl w-full max-w-lg mx-4 p-6 animate-in shadow-lg border border-border/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold heading-display text-foreground">Add Expense</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* TYPE TOGGLE */}
          <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
            <button
              type="button"
              onClick={() => setType("debit")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                type === "debit" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("credit")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                type === "credit" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Income
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Coffee at Starbucks"
              className="h-12 rounded-xl bg-muted/40 border-border/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-12 rounded-xl bg-muted/40 border-border/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl bg-muted/40 border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat, i) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setSelectedCategory(i)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center ${
                    selectedCategory === i
                      ? "border-primary bg-primary/10 shadow-[var(--shadow-sm)]"
                      : "border-border/40 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl font-semibold shadow-[var(--shadow-md)]">
            {type === "debit" ? "Add Expense" : "Add Income"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseDialog;
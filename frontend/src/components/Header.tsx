import { useState } from "react";
import { Plus, Mail, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { gmailApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onAddExpense: () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
};

const Header = ({ onAddExpense }: HeaderProps) => {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());

  // Read real user from localStorage
  const storedUser = localStorage.getItem("paisa_user");
  const user = storedUser ? JSON.parse(storedUser) : { name: "User", email: "" };
  const firstName = user.name?.split(" ")[0] || "User";

  // Gmail status
  const { data: gmailStatus } = useQuery({
    queryKey: ["gmail-status"],
    queryFn: () => gmailApi.getStatus(),
  });

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="mb-8 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{getGreeting()}</p>
          <h2 className="text-3xl font-bold text-foreground heading-display mt-0.5">
            {firstName}{" "}
            <span className="inline-block animate-[pulse-soft_3s_ease-in-out_infinite]">
              {new Date().getHours() < 18 ? "☀️" : "🌙"}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center gap-0.5 glass-card rounded-xl px-3 py-2">
            <button
              onClick={() => changeMonth(-1)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground px-2.5 whitespace-nowrap">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add expense */}
          <Button
            size="sm"
            className="gap-1.5 rounded-xl shadow-[var(--shadow-sm)] bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onAddExpense}
          >
            <Plus className="w-4 h-4" /> Add expense
          </Button>

          {/* Gmail sync button */}
          {gmailStatus?.connected ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary rounded-xl hover:bg-primary/10"
              onClick={() => navigate("/gmail")}
            >
              <Mail className="w-4 h-4" /> Sync Gmail
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground rounded-xl hover:bg-accent/60"
              onClick={() => navigate("/gmail")}
            >
              <Mail className="w-4 h-4" /> Connect Gmail
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-2">
        Your financial snapshot for{" "}
        <span className="font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
      </p>

      {/* Gmail sync banner — only show if connected */}
      {gmailStatus?.connected && (
        <div className="mt-5 glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground">
                Gmail sync active — auto-detecting{" "}
                <span className="font-semibold">HDFC Bank</span> transactions
              </p>
              <p className="text-sm text-muted-foreground">
                Syncs every 5 minutes automatically
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => navigate("/gmail")}
            >
              Manage
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
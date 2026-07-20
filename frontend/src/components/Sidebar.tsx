import { LayoutGrid, ArrowLeftRight, Wallet, BarChart3, Mail, Tag, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";

const navItems = [
  { label: "MAIN", items: [
    { icon: LayoutGrid, label: "Overview",     path: "/" },
    { icon: ArrowLeftRight, label: "Transactions", path: "/transactions", badge: "new" },
    { icon: Wallet,      label: "Budgets",      path: "/budgets" },
    { icon: BarChart3,   label: "Analytics",    path: "/analytics" },
  ]},
  { label: "AUTOMATION", items: [
    { icon: Mail, label: "Gmail Sync", path: "/gmail" },
    { icon: Tag,  label: "Categories", path: "/categories" },
  ]},
];

const Sidebar = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Read real user from localStorage
  const storedUser = localStorage.getItem("paisa_user");
  const user       = storedUser
    ? JSON.parse(storedUser)
    : { name: "User", email: "" };

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    localStorage.removeItem("paisa_user");
    localStorage.removeItem("paisa_token");
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <aside className="w-60 min-h-screen bg-card/60 backdrop-blur-xl border-r border-border/40 flex flex-col py-8 px-5">

      {/* LOGO */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold heading-display text-foreground">Ctrl F</h1>
          <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Expense Tracker
          </p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-7">
        {navItems.map((section) => (
          <div key={section.label}>
            <p className="label-uppercase px-3 mb-2.5">{section.label}</p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-[var(--shadow-sm)]"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="ml-auto text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* USER */}
      <div className="mt-auto border-t border-border/40 pt-5 space-y-3">
        <div className="px-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xs font-bold shadow-[var(--shadow-sm)]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
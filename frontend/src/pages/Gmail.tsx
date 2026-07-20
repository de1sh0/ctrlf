import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gmailApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Mail, Zap, Shield, Clock, CheckCircle2,
  XCircle, RefreshCw, Link2, Unlink, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HDFC_PATTERNS = [
  "Rs.340.00 debited from a/c XX1234. Info: Zomato order.",
  "INR 1,240.00 debited. UPI/Swiggy/Food delivery.",
  "Your a/c XX1234 credited with Rs.82,000.00. Salary.",
];

const Gmail = () => {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["gmail-status"],
    queryFn: () => gmailApi.getStatus(),
    refetchOnWindowFocus: true,
  });

  // Handle redirect back from Google OAuth
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Gmail connected successfully!");
      refetch();
      setSearchParams({});
    }
    if (searchParams.get("error")) {
      toast.error("Failed to connect Gmail. Please try again.");
      setSearchParams({});
    }
  }, [searchParams]);

  const connectMutation = useMutation({
    mutationFn: () => gmailApi.getConnectUrl(),
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: () => toast.error("Failed to get connect URL"),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
      toast.success("Gmail disconnected");
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await gmailApi.sync();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(res.synced > 0
        ? `✅ Synced ${res.synced} new transaction${res.synced > 1 ? "s" : ""}!`
        : "No new transactions found"
      );
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 py-8 px-10 overflow-auto max-h-screen">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Gmail Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically detect transactions from HDFC Bank email alerts
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-8">

          {/* Connection card */}
          <div className="col-span-2 bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Gmail Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Gmail to auto-detect bank transactions
                  </p>
                </div>
              </div>

              {!isLoading && (
                <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                  status?.connected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {status?.connected
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>
                    : <><XCircle className="w-3.5 h-3.5" /> Not connected</>
                  }
                </div>
              )}
            </div>

            {status?.connected ? (
              <div className="space-y-4">
                {/* Connected state */}
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Auto-sync active
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Checking for new HDFC Bank emails every 5 minutes
                    </p>
                  </div>
                  <Button
                    onClick={handleSync}
                    disabled={syncing}
                    size="sm"
                    className="rounded-xl gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync now"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {status.gmail_email ?? "Gmail connected"}
                    </span>
                  </div>
                  <Button
                    onClick={() => disconnectMutation.mutate()}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not connected state */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click below to connect your Gmail account. You'll be redirected to Google
                  to grant read-only access to your emails. We only read bank alert emails —
                  nothing else.
                </p>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="gap-2 rounded-xl"
                >
                  <Link2 className="w-4 h-4" />
                  {connectMutation.isPending ? "Redirecting..." : "Connect Gmail"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">How it works</h3>
            <div className="space-y-4">
              {[
                { icon: Link2, title: "Connect Gmail", desc: "One-time Google OAuth login" },
                { icon: Mail, title: "We watch HDFC alerts", desc: "Only bank emails, nothing else" },
                { icon: Zap, title: "AI parses them", desc: "spaCy + TF-IDF extracts amount & category" },
                { icon: CheckCircle2, title: "Auto-added", desc: "Appears on dashboard with ⚡ badge" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <step.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy + Email examples */}
        <div className="grid grid-cols-2 gap-5">

          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Privacy & Security</h3>
            </div>
            <div className="space-y-3">
              {[
                "Read-only access — we can never send emails on your behalf",
                "Only HDFC Bank alert emails are read, everything else is ignored",
                "OAuth tokens are encrypted and stored securely",
                "You can disconnect anytime and all tokens are deleted",
                "We never store your email password",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Email patterns we detect</h3>
            </div>
            <div className="space-y-2">
              {HDFC_PATTERNS.map((pattern, i) => (
                <div key={i} className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {pattern}
                  </p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                ↑ These are automatically parsed and added to your expenses
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Gmail;
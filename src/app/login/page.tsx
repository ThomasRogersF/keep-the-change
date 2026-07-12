"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/use-auth";
import { BookOpen, Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";

type LoginState = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>("idle");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState("sending");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setState("error");
        toast.error(error.message);
        return;
      }

      setState("sent");
    } catch {
      setState("error");
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Subtle radial background treatment */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_center,var(--color-primary)_0%,transparent_40%)] opacity-[0.08] dark:opacity-[0.15] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,var(--color-finance-wealth)_0%,transparent_50%)] opacity-[0.04] dark:opacity-[0.08] pointer-events-none" />

      <Toaster position="top-center" richColors />

      <div className="w-full max-w-sm space-y-8 z-10 relative">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Ledgerly</h1>
            <p className="text-sm text-muted-foreground">
              Smart budgeting, beautifully simple
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
          {state === "sent" ? (
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a magic link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState("idle")}
                className="text-muted-foreground"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email to receive a magic link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                  disabled={state === "sending" || !email.trim()}
                >
                  {state === "sending" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending link…
                    </>
                  ) : (
                    <>
                      Send magic link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Your data is stored locally on this device.
          <br />
          Cloud sync can be enabled later.
        </p>
      </div>
    </div>
  );
}

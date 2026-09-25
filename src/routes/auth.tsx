import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in | TNiks Tirezone Inventory" },
      {
        name: "description",
        content: "Secure sign in for Niks Tirezone staff to manage inventory, sales and purchases.",
      },
      { property: "og:title", content: "Staff sign in | Niks Tirezone Inventory" },
      { property: "og:description", content: "Secure sign in for Niks Tirezone staff." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsAdmin, setNeedsAdmin] = useState(false);
  const [signUp, setSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    supabase.rpc("admin_exists").then(({ data }) => {
      if (data === false) {
        setNeedsAdmin(true);
        setSignUp(true);
      }
    });
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (signUp && needsAdmin) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Admin account created. Check your email to confirm, then sign in.");
          setSignUp(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <Link to="/" className="label-caps">
          ← Back
        </Link>
        <h1 className="mt-4 text-3xl font-bold uppercase tracking-wide">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Niks Tirezone inventory &amp; sales system
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : signUp ? "Create admin account" : "Sign in"}
          </Button>
        </form>
        {needsAdmin ? (
          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-muted-foreground underline"
            onClick={() => setSignUp((v) => !v)}
          >
            {signUp
              ? "Already have an account? Sign in"
              : "No admin yet? Create the first admin account"}
          </button>
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Accounts are created by the shop administrator. Ask your admin to add you.
          </p>
        )}
      </div>
    </div>
  );
}

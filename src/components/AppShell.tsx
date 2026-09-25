import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MovementNotifications } from "@/components/MovementNotifications";
import { ActivityLogsSidebar } from "@/components/ActivityLogsSidebar";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useIsAdmin } from "@/hooks/use-is-admin";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/bodega", label: "Bodega" },
  { to: "/store", label: "Store" },
  { to: "/tires", label: "Tire master" },
  { to: "/purchases", label: "Purchases" },
  { to: "/sales", label: "Sales" },
  { to: "/adjustments", label: "Adjustments" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/customers", label: "Customers" },
  { to: "/staff", label: "Staff accounts" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  useRealtimeSync();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-primary text-primary">
              <span className="h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="font-display text-lg font-bold uppercase tracking-widest">
              Niks Tirezone
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-muted-foreground lg:inline">{email}</span>
            <MovementNotifications />
            <ActivityLogsSidebar />
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2">
          {nav
            .filter((item) => isAdmin || item.to !== "/staff")
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="label-caps whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                activeProps={{
                  className:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

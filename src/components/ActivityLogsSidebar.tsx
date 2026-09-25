import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const db = supabase as any;

const SECTION_LABELS: Record<string, string> = {
  tires: "Tire master",
  purchases: "Purchases",
  sales: "Sales",
  transfers: "Transfers",
  adjustments: "Stock adjustments",
  suppliers: "Suppliers",
  customers: "Customers",
};

const ACTION_LABELS: Record<string, string> = {
  insert: "Added",
  update: "Edited",
  delete: "Deleted",
};

type LogRow = {
  id: string;
  occurred_at: string;
  actor_email: string | null;
  action: string;
  table_name: string;
  summary: string | null;
};

export function ActivityLogsSidebar() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["activity_logs"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await db
        .from("activity_logs")
        .select("id, occurred_at, actor_email, action, table_name, summary")
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.actor_email, ACTION_LABELS[r.action] ?? r.action, SECTION_LABELS[r.table_name] ?? r.table_name, r.summary]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Activity logs</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-wide">Activity logs</SheetTitle>
          <SheetDescription>Who added, edited or deleted a record — and when.</SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <Input
            placeholder="Search by person, section or record…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <p className="text-sm font-medium">
                {ACTION_LABELS[r.action] ?? r.action} · {SECTION_LABELS[r.table_name] ?? r.table_name}
              </p>
              {r.summary && <p className="text-xs text-muted-foreground">{r.summary}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {r.actor_email ?? "Unknown"} · {new Date(r.occurred_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

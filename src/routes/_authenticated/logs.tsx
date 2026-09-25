import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const db = supabase as any;

const SECTION_LABELS: Record<string, string> = {
  tires: "Tire master",
  purchases: "Purchases",
  sales: "Sales",
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

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({
    meta: [
      { title: "Activity logs | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "History of every record added, edited or deleted in the Niks Tirezone system.",
      },
      { property: "og:title", content: "Activity logs | Niks Tirezone Inventory" },
      {
        property: "og:description",
        content: "See who changed what and when across the shop records.",
      },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["activity_logs"],
    queryFn: async () => {
      const { data, error } = await db
        .from("activity_logs")
        .select("id, occurred_at, actor_email, action, table_name, summary")
        .order("occurred_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [
        r.actor_email,
        ACTION_LABELS[r.action] ?? r.action,
        SECTION_LABELS[r.table_name] ?? r.table_name,
        r.summary,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wide">Activity logs</h1>
        <p className="text-sm text-muted-foreground">
          Every record added, edited or deleted — with who did it and when. Showing the 500 most
          recent entries.
        </p>
      </div>

      <Input
        placeholder="Search by person, section or record…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="label-caps px-4 py-3">When</th>
              <th className="label-caps px-4 py-3">Who</th>
              <th className="label-caps px-4 py-3">What</th>
              <th className="label-caps px-4 py-3">Section</th>
              <th className="label-caps px-4 py-3">Record</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  Could not load the activity log.
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(r.occurred_at).toLocaleString("en-PH")}
                </td>
                <td className="px-4 py-3">{r.actor_email ?? "System"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      r.action === "delete"
                        ? "bg-destructive/15 text-destructive"
                        : r.action === "update"
                          ? "bg-warning/15 text-warning"
                          : "bg-primary/15 text-primary"
                    }`}
                  >
                    {ACTION_LABELS[r.action] ?? r.action}
                  </span>
                </td>
                <td className="px-4 py-3">{SECTION_LABELS[r.table_name] ?? r.table_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

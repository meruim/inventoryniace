import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { peso } from "@/lib/resources";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ItemFilters, applyItemFilters, type SortOrder } from "@/components/ItemFilters";
import { ResourcePage } from "@/components/ResourcePage";

export function StockLocationPage({ location }: { location: "bodega" | "store" }) {
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState<SortOrder>("az");
  const { data, isLoading } = useQuery({
    queryKey: ["inventory_view"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("inventory_view").select("*").order("tire_code");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const all = data ?? [];
  const rows = applyItemFilters(
    all.filter((r) => `${r.tire_code} ${r.brand} ${r.size} ${r.pattern ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    size,
    sort,
  );
  const isBodega = location === "bodega";
  const inKey = `${location}_in`, outKey = `${location}_out`, stockKey = `${location}_stock`;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide">{isBodega ? "Bodega" : "Store"}</h1>
            <p className="text-sm text-muted-foreground">
              {isBodega
                ? "Beginning = stock entered in Tire master. IN = purchases received. OUT = transfers sent to the store."
                : "IN = transfers from the bodega (plus adjustments). OUT = sales."}
            </p>
          </div>
          <ItemFilters search={search} setSearch={setSearch} size={size} setSize={setSize} sort={sort} setSort={setSort} sizes={all.map((r) => r.size)} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Tire code", "Brand", "Size", "Pattern", ...(isBodega ? ["Beginning"] : []), "IN", "OUT", "Stock", ...(isAdmin ? ["Unit cost"] : []), "Price"].map((h) => (
                  <th key={h} className="label-caps whitespace-nowrap px-3 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td className="px-3 py-6 text-muted-foreground" colSpan={isBodega ? 10 : 9}>Loading…</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{r.tire_code}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{r.brand}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{r.size}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{r.pattern ?? "—"}</td>
                  {isBodega && <td className="px-3 py-2.5 font-medium">{r.beginning_stock}</td>}
                  <td className="px-3 py-2.5 text-success">{r[inKey]}</td>
                  <td className="px-3 py-2.5 text-destructive">{r[outKey]}</td>
                  <td className="px-3 py-2.5 font-semibold">{r[stockKey]}</td>
                  {isAdmin && <td className="whitespace-nowrap px-3 py-2.5">{peso(r.unit_cost)}</td>}
                  <td className="whitespace-nowrap px-3 py-2.5">{peso(r.selling_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isBodega && isAdmin && <ResourcePage resourceKey="transfers" />}
    </div>
  );
}

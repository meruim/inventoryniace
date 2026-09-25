import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { peso } from "@/lib/resources";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ItemFilters, applyItemFilters, type SortOrder } from "@/components/ItemFilters";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Live tire stock levels, reorder status and stock value per item.",
      },
      { property: "og:title", content: "Inventory | Niks Tirezone Inventory" },
      {
        property: "og:description",
        content: "Live tire stock levels, reorder status and stock value.",
      },
    ],
  }),
  component: Inventory,
});

const statusClass: Record<string, string> = {
  "IN STOCK": "bg-success/15 text-success",
  REORDER: "bg-warning/15 text-warning",
  "OUT OF STOCK": "bg-destructive/15 text-destructive",
};

function Inventory() {
  const [search, setSearch] = useState("");
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState<SortOrder>("az");
  const isAdmin = useIsAdmin();
  const { data, isLoading } = useQuery({
    queryKey: ["inventory_view"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_view")
        .select("*")
        .order("tire_code");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const rows = applyItemFilters(
    (data ?? []).filter((r) =>
      `${r.tire_code} ${r.brand} ${r.size} ${r.pattern ?? ""} ${r.supplier_name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    size,
    sort,
  );
  const headers = [
    "Tire code",
    "Brand",
    "Size",
    "Pattern",
    "Supplier",
    "Bodega IN",
    "Bodega OUT",
    "Bodega stock",
    "Store IN",
    "Store OUT",
    "Store stock",
    "Total stock",
    "Reorder",
    "Status",
    ...(isAdmin ? ["Unit cost"] : []),
    "Price",
    ...(isAdmin ? ["Value"] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock is calculated from beginning stock, purchases, sales and adjustments.
          </p>
        </div>
        <ItemFilters
          search={search}
          setSearch={setSearch}
          size={size}
          setSize={setSize}
          sort={sort}
          setSort={setSort}
          sizes={(data ?? []).map((r) => r.size)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h) => (
                <th key={h} className="label-caps whitespace-nowrap px-3 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={headers.length}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={headers.length}>
                  No tires yet — add them under Tire master.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5 font-medium">{r.tire_code}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.brand}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.size}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.pattern ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.supplier_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-success">{r.bodega_in}</td>
                <td className="px-3 py-2.5 text-destructive">{r.bodega_out}</td>
                <td className="px-3 py-2.5 font-semibold">{r.bodega_stock}</td>
                <td className="px-3 py-2.5 text-success">{r.store_in}</td>
                <td className="px-3 py-2.5 text-destructive">{r.store_out}</td>
                <td className="px-3 py-2.5 font-semibold">{r.store_stock}</td>
                <td className="px-3 py-2.5 font-semibold">{r.current_stock}</td>
                <td className="px-3 py-2.5">{r.reorder_level}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[r.status] ?? ""}`}
                  >
                    {r.status}
                  </span>
                </td>
                {isAdmin && <td className="whitespace-nowrap px-3 py-2.5">{peso(r.unit_cost)}</td>}
                <td className="whitespace-nowrap px-3 py-2.5">{peso(r.selling_price)}</td>
                {isAdmin && (
                  <td className="whitespace-nowrap px-3 py-2.5">{peso(r.stock_value)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

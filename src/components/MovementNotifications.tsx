import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const db = supabase as any;
const SEEN_KEY = "tire-shop:movements-seen";

type Movement = {
  id: string;
  at: string;
  direction: "in" | "out";
  qty: number;
  tireId: string | null;
  source: string;
  where: string;
  isNew?: boolean;
};

function useMovements() {
  return useQuery({
    queryKey: ["movements"],
    refetchInterval: 15000,
    queryFn: async () => {
      const [tires, purchases, transfers, sales, adjustments] = await Promise.all([
        db.from("tires").select("id, tire_code, brand, size, beginning_stock, created_at"),
        db.from("purchases").select("id, purchase_date, tire_id, qty").order("purchase_date", { ascending: false }).limit(50),
        db.from("transfers").select("id, transfer_date, tire_id, qty").order("transfer_date", { ascending: false }).limit(50),
        db.from("sales").select("id, sale_date, tire_id, qty").order("sale_date", { ascending: false }).limit(50),
        db.from("adjustments").select("id, adjustment_date, tire_id, qty").order("adjustment_date", { ascending: false }).limit(50),
      ]);

      const tireMap = new Map<string, string>();
      for (const t of tires.data ?? []) {
        tireMap.set(t.id, `${t.tire_code} · ${t.brand} ${t.size}`);
      }

      const items: Movement[] = [];
      for (const t of tires.data ?? [])
        items.push({ id: `n-${t.id}`, at: String(t.created_at ?? "").slice(0, 10), direction: "in", qty: Number(t.beginning_stock ?? 0), tireId: t.id, source: "New tire added in Tire master", where: "Tire master", isNew: true } as Movement);
      for (const r of purchases.data ?? [])
        items.push({ id: `p-${r.id}`, at: r.purchase_date, direction: "in", qty: Number(r.qty ?? 0), tireId: r.tire_id, source: "Purchase received", where: "Bodega" });
      for (const r of transfers.data ?? [])
        items.push({ id: `t-${r.id}`, at: r.transfer_date, direction: "in", qty: Number(r.qty ?? 0), tireId: r.tire_id, source: "Transferred from bodega", where: "Store" });
      for (const r of sales.data ?? [])
        items.push({ id: `s-${r.id}`, at: r.sale_date, direction: "out", qty: Number(r.qty ?? 0), tireId: r.tire_id, source: "Sold", where: "Store" });
      for (const r of adjustments.data ?? []) {
        const qty = Number(r.qty ?? 0);
        items.push({ id: `a-${r.id}`, at: r.adjustment_date, direction: qty < 0 ? "out" : "in", qty: Math.abs(qty), tireId: r.tire_id, source: "Stock adjustment", where: "Store" });
      }

      return items
        .filter((m) => m.qty !== 0 || m.isNew)
        .map((m) => ({ ...m, tire: (m.tireId && tireMap.get(m.tireId)) || "Unknown tire" }))
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 100);
    },
  });
}

export function MovementNotifications() {
  const { data, isLoading } = useMovements();
  const [seen, setSeen] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeen(window.localStorage.getItem(SEEN_KEY) ?? "");
  }, []);

  const items = data ?? [];
  const unread = useMemo(() => (seen ? items.filter((m) => m.at > seen).length : items.length), [items, seen]);

  const totals = useMemo(() => {
    let tin = 0;
    let tout = 0;
    for (const m of items) {
      if (m.direction === "in") {
        if (m.source === "Purchase received" || m.source === "New tire added in Tire master") tin += m.qty;
      } else tout += m.qty;
    }
    return { tin, tout };
  }, [items]);

  function markSeen(next: boolean) {
    setOpen(next);
    if (next && items[0]) {
      window.localStorage.setItem(SEEN_KEY, items[0].at);
      setSeen(items[0].at);
    }
  }

  return (
    <Sheet open={open} onOpenChange={markSeen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative" aria-label="Tire movement notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-wide">Tire movements</SheetTitle>
          <SheetDescription>Every tire that came in and every tire that went out or was sold.</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 px-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="label-caps text-muted-foreground">Tires in</p>
            <p className="text-2xl font-bold text-success">+{totals.tin}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="label-caps text-muted-foreground">Tires out / sold</p>
            <p className="text-2xl font-bold text-destructive">−{totals.tout}</p>
          </div>
        </div>

        <div className="space-y-2 px-4 pb-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No tire movements yet.</p>
          )}
          {items.map((m: any) => (
            <div key={m.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{m.tire}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.source} · {m.where} · {m.at}
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap text-sm font-bold ${m.direction === "in" ? "text-success" : "text-destructive"}`}
                >
                  {m.direction === "in" ? "+" : "−"}
                  {m.qty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

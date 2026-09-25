import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { peso, resources } from "@/lib/resources";
import { exportAllToExcel, parseWorkbookFile, parseSheet } from "@/lib/excel";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";

const db = supabase as any;

/** One-tap backup/restore of every section through a single .xlsx workbook. */
function ExcelBackupCard() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleExportAll() {
    setBusy(true);
    try {
      const entries = Object.values(resources);
      const results = await Promise.all(
        entries.map((r) =>
          db.from(r.table).select("*").order(r.orderBy.column, { ascending: r.orderBy.ascending }),
        ),
      );
      const sections = entries.map((resource, i) => {
        if (results[i].error) throw results[i].error;
        return { resource, rows: (results[i].data ?? []) as Record<string, any>[] };
      });
      const tires = sections.find((s) => s.resource.table === "tires")?.rows ?? [];
      const tireLabel = new Map(
        tires.map((t) => [t["id"], `${t["tire_code"]} · ${t["brand"]} ${t["size"]}`]),
      );
      exportAllToExcel(sections, tireLabel);
      toast.success("Workbook downloaded — one tab per section.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportAll(file: File) {
    setBusy(true);
    try {
      const all = Object.values(resources);
      const { data: tireRows, error: tireError } = await supabase
        .from("tires")
        .select("id, tire_code");
      if (tireError) throw tireError;
      const tireCodeToId = new Map(
        (tireRows ?? []).map((t: any) => [String(t.tire_code).toLowerCase(), t.id as string]),
      );

      // Insert tires first so their codes resolve for the other tabs.
      const buffer = await file.arrayBuffer();
      const book = XLSX.read(buffer, { type: "array", cellDates: true });
      const tireResource = resources["tires"]!;
      const tireSheetName = book.SheetNames.find(
        (n) => n.trim().toLowerCase() === tireResource.title.toLowerCase(),
      );
      if (tireSheetName) {
        const { rows, errors } = parseSheet(
          book.Sheets[tireSheetName]!,
          tireResource,
          tireCodeToId,
        );
        if (errors.length > 0) throw new Error(`[${tireSheetName}] ${errors[0]}`);
        if (rows.length > 0) {
          const { error } = await db.from("tires").insert(rows);
          if (error) throw error;
          const { data: refreshed } = await supabase.from("tires").select("id, tire_code");
          for (const t of refreshed ?? [])
            tireCodeToId.set(String(t.tire_code).toLowerCase(), t.id);
        }
      }

      const { byTable, errors } = await parseWorkbookFile(file, all, tireCodeToId);
      if (errors.length > 0) {
        toast.error(
          `Import stopped. ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`,
        );
        return;
      }
      let total = 0;
      for (const resource of all) {
        const rows = byTable[resource.table];
        if (!rows || resource.table === "tires") continue; // tires already inserted
        const { error } = await db.from(resource.table).insert(rows);
        if (error) throw error;
        total += rows.length;
      }
      total += tireSheetName ? (byTable["tires"]?.length ?? 0) : 0;
      if (total === 0 && !tireSheetName)
        toast.error("Nothing to import — no matching tabs or rows.");
      else toast.success(`Imported ${total} record${total === 1 ? "" : "s"} across all sections.`);
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="label-caps">Excel backup</p>
      <p className="mt-2 text-sm text-muted-foreground">
        One Excel file for the whole shop — every section on its own tab. Export to download
        everything, or import the same file to add records in bulk.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void handleExportAll()} disabled={busy}>
          <Download className="mr-1.5 size-4" />
          Export all to Excel
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>
          <Upload className="mr-1.5 size-4" />
          {busy ? "Working…" : "Import all from Excel"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportAll(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Live stock value, sales, profit and reorder alerts for the Niks Tirezone.",
      },
      { property: "og:title", content: "Dashboard | Niks Tirezone Inventory" },
      {
        property: "og:description",
        content: "Live stock value, sales, profit and reorder alerts.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "destructive";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-bold ${
          tone === "warning"
            ? "text-warning"
            : tone === "destructive"
              ? "text-destructive"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Dashboard() {
  const isAdmin = useIsAdmin();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [inv, sales] = await Promise.all([
        supabase.from("inventory_view").select("*"),
        supabase.from("sales").select("qty, unit_price, unit_cost"),
      ]);
      if (inv.error) throw inv.error;
      if (sales.error) throw sales.error;
      return { inventory: inv.data ?? [], sales: sales.data ?? [] };
    },
  });

  const inventory = data?.inventory ?? [];
  const sales = data?.sales ?? [];
  const units = inventory.reduce((sum, r: any) => sum + Number(r.current_stock ?? 0), 0);
  const value = inventory.reduce((sum, r: any) => sum + Number(r.stock_value ?? 0), 0);
  const revenue = sales.reduce((sum, r: any) => sum + Number(r.qty) * Number(r.unit_price), 0);
  const cogs = sales.reduce((sum, r: any) => sum + Number(r.qty) * Number(r.unit_cost), 0);
  const profit = revenue - cogs;
  const reorder = inventory.filter((r: any) => r.status === "REORDER").length;
  const out = inventory.filter((r: any) => r.status === "OUT OF STOCK").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wide">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Everything updates automatically from your records.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tire items" value={String(inventory.length)} />
        <Stat label="Units in stock" value={String(units)} />
        {isAdmin && <Stat label="Inventory value" value={peso(value)} />}
        <Stat label="Total sales" value={peso(revenue)} />
        {isAdmin && <Stat label="Cost of goods sold" value={peso(cogs)} />}
        {isAdmin && <Stat label="Gross profit" value={peso(profit)} />}
        <Stat label="Needs reorder" value={String(reorder)} tone="warning" />
        <Stat label="Out of stock" value={String(out)} tone="destructive" />
      </div>
      {isAdmin && <ExcelBackupCard />}
    </div>
  );
}

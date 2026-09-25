import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resources, peso, type Field } from "@/lib/resources";
import { exportToExcel, parseExcelFile } from "@/lib/excel";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ItemFilters, applyItemFilters, type SortOrder } from "@/components/ItemFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Row = Record<string, any>;

const db = supabase as any;

export function ResourcePage({ resourceKey }: { resourceKey: keyof typeof resources }) {
  const baseResource = resources[resourceKey]!;
  const isAdmin = useIsAdmin();
  const resource = useMemo(
    () => ({
      ...baseResource,
      readOnly: !!(baseResource.readOnly || (baseResource.adminWrite && !isAdmin)),
      fields: baseResource.fields.filter((f) => isAdmin || !f.adminOnly),
    }),
    [baseResource, isAdmin],
  );
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState<SortOrder>("az");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const listQuery = useQuery({
    queryKey: [resource.table],
    queryFn: async () => {
      const { data, error } = await db
        .from(resource.table)
        .select("*")
        .order(resource.orderBy.column, { ascending: resource.orderBy.ascending });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const needsTires = baseResource.fields.some((f) => f.type === "tire");
  const tiresQuery = useQuery({
    queryKey: ["tires", "options"],
    enabled: needsTires,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tires")
        .select("id, tire_code, brand, size")
        .order("tire_code");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const tireLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tiresQuery.data ?? []) map.set(t['id'], `${t['tire_code']} · ${t['brand']} ${t['size']}`);
    return map;
  }, [tiresQuery.data]);

  const tireCodeToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tiresQuery.data ?? []) map.set(String(t['tire_code']).toLowerCase(), t['id']);
    return map;
  }, [tiresQuery.data]);

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const { rows: payloads, errors } = await parseExcelFile(file, resource, tireCodeToId);
      if (errors.length > 0) {
        toast.error(`Import stopped. ${errors.slice(0, 3).join(" · ")}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ""}`);
        return;
      }
      if (payloads.length === 0) {
        toast.error("Nothing to import — the file has no matching columns.");
        return;
      }
      const { error } = await db.from(resource.table).insert(payloads);
      if (error) throw error;
      toast.success(`Imported ${payloads.length} ${resource.title.toLowerCase()} record${payloads.length === 1 ? "" : "s"}`);
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const save = useMutation({
    mutationFn: async (values: Row) => {
      const payload: Row = {};
      for (const field of resource.fields) {
        if (field.key === "amount_paid" && values['payment_mode'] === "Full") continue;
        const raw = values[field.key];
        if (field.type === "number") payload[field.key] = raw === "" || raw == null ? 0 : Number(raw);
        else payload[field.key] = raw === "" ? null : raw;
      }
      if (editing?.['id']) {
        const { error } = await db.from(resource.table).update(payload).eq("id", editing['id']);
        if (error) throw error;
      } else {
        const { error } = await db.from(resource.table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Changes saved" : `New ${resource.singular} added`);
      setOpen(false);
      setEditing(null);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await db.from(resource.table).delete().eq("id", row['id']);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteRow(null);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tireSize = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tiresQuery.data ?? []) map.set(t['id'], t['size']);
    return map;
  }, [tiresQuery.data]);
  const hasSize = baseResource.fields.some((f) => f.key === "size" || f.type === "tire");
  const getSize = (r: Row) => (r['size'] ?? tireSize.get(r['tire_id']) ?? "") as string;
  const nameField = resource.fields.find((f) => f.key === "name") ?? resource.fields.find((f) => f.key === "brand") ?? resource.fields.find((f) => f.type === "tire");
  const getName = (r: Row) =>
    nameField ? (nameField.type === "tire" ? tireLabel.get(r[nameField.key]) ?? "" : String(r[nameField.key] ?? "")) : "";

  const filteredRows = (listQuery.data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const haystack = resource.fields
      .map((f) => (f.type === "tire" ? tireLabel.get(row[f.key]) ?? "" : String(row[f.key] ?? "")))
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const rows = applyItemFilters(filteredRows, hasSize ? size : "all", sort, getSize, getName);

  function display(field: Field, row: Row) {
    const value = row[field.key];
    if (field.type === "tire") return tireLabel.get(value) ?? "—";
    if (field.type === "number" && field.step === "0.01") return peso(value);
    if (value == null || value === "") return "—";
    return String(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide">{resource.title}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ItemFilters
            search={search}
            setSearch={setSearch}
            size={size}
            setSize={setSize}
            sort={sort}
            setSort={setSort}
            sizes={hasSize ? (listQuery.data ?? []).map(getSize) : undefined}
          />
          <Button
            variant="outline"
            onClick={() => exportToExcel(resource, rows, tireLabel)}
            disabled={rows.length === 0}
          >
            <Download className="mr-1.5 size-4" />
            Export Excel
          </Button>
          {!resource.readOnly && <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={importing}>
            <Upload className="mr-1.5 size-4" />
            {importing ? "Importing…" : "Import Excel"}
          </Button>}
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          {!resource.readOnly && (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add {resource.singular}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {resource.fields.map((field) => (
                <th key={field.key} className="label-caps whitespace-nowrap px-3 py-3 text-left">
                  {field.label}
                </th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={resource.fields.length + 1}>
                  Loading…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={resource.fields.length + 1}>
                  Nothing here yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row['id']} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                {resource.fields.map((field) => (
                  <td key={field.key} className="whitespace-nowrap px-3 py-2.5">
                    {display(field, row)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {!resource.readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(row);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteRow(row)}>
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase">
              {editing ? `Edit ${resource.singular}` : `New ${resource.singular}`}
            </DialogTitle>
            <DialogDescription>Fill in the details and save.</DialogDescription>
          </DialogHeader>
          <form
            id="resource-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              save.mutate(Object.fromEntries(formData.entries()));
            }}
          >
            {resource.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "tire" ? (
                  <Select name={field.key} defaultValue={editing?.[field.key] ?? undefined} required={field.required ?? false}>
                    <SelectTrigger id={field.key}>
                      <SelectValue placeholder="Select a tire" />
                    </SelectTrigger>
                    <SelectContent>
                      {(tiresQuery.data ?? []).map((tire) => (
                        <SelectItem key={tire['id']} value={tire['id']}>
                          {tire['tire_code']} · {tire['brand']} {tire['size']}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "select" ? (
                  <Select name={field.key} defaultValue={editing?.[field.key] ?? field.options?.[0]} required={field.required ?? false}>
                    <SelectTrigger id={field.key}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.key}
                    name={field.key}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    step={field.step}
                    required={field.required}
                    placeholder={field.placeholder}
                    defaultValue={editing?.[field.key] ?? ""}
                  />
                )}
              </div>
            ))}
          </form>
          <DialogFooter>
            <Button type="submit" form="resource-form" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(next) => !next && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {resource.singular}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRow && remove.mutate(deleteRow)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

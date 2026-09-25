import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SortOrder = "az" | "za";

export function applyItemFilters<T extends Record<string, any>>(
  rows: T[],
  size: string,
  sort: SortOrder,
  getSize: (r: T) => string = (r) => r["size"] ?? "",
  getName: (r: T) => string = (r) => `${r["brand"] ?? ""} ${r["tire_code"] ?? ""}`,
) {
  const filtered = size === "all" ? rows : rows.filter((r) => getSize(r) === size);
  return [...filtered].sort((a, b) => {
    const c = getName(a).localeCompare(getName(b), undefined, { numeric: true, sensitivity: "base" });
    return sort === "az" ? c : -c;
  });
}

export function ItemFilters(props: {
  search: string;
  setSearch: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  sort: SortOrder;
  setSort: (v: SortOrder) => void;
  sizes?: string[] | undefined;
}) {
  const sizes = props.sizes ? [...new Set(props.sizes.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : null;
  return (
    <div className="flex flex-wrap gap-2">
      <Input placeholder="Search…" value={props.search} onChange={(e) => props.setSearch(e.target.value)} className="w-44" />
      {sizes && (
        <Select value={props.size} onValueChange={props.setSize}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Size" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sizes</SelectItem>
            {sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={props.sort} onValueChange={(v) => props.setSort(v as SortOrder)}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="az">A → Z</SelectItem>
          <SelectItem value="za">Z → A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

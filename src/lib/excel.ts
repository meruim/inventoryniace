import * as XLSX from "xlsx";
import type { Resource } from "@/lib/resources";

type Row = Record<string, any>;

function buildSheet(resource: Resource, rows: Row[], tireLabel: Map<string, string>) {
  const headers = resource.fields.map((f) => f.label);
  const data = rows.map((row) =>
    resource.fields.map((field) => {
      const value = row[field.key];
      if (field.type === "tire") return tireLabel.get(value)?.split(" · ")[0] ?? "";
      return value ?? "";
    }),
  );
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  sheet["!cols"] = headers.map((h, i) => ({
    wch: Math.max(h.length + 2, ...data.map((r) => String(r[i]).length + 2), 12),
  }));
  return sheet;
}

/** Sheet/tab name used for a resource inside a workbook. */
export function sheetName(resource: Resource) {
  return resource.title.slice(0, 31);
}

/** Export rows to a .xlsx file using the resource's field labels as headers. */
export function exportToExcel(
  resource: Resource,
  rows: Row[],
  tireLabel: Map<string, string>,
) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, buildSheet(resource, rows, tireLabel), sheetName(resource));
  XLSX.writeFile(book, `${resource.table}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Export every section into a single .xlsx workbook with one tab per section. */
export function exportAllToExcel(
  sections: { resource: Resource; rows: Row[] }[],
  tireLabel: Map<string, string>,
) {
  const book = XLSX.utils.book_new();
  for (const { resource, rows } of sections) {
    XLSX.utils.book_append_sheet(book, buildSheet(resource, rows, tireLabel), sheetName(resource));
  }
  XLSX.writeFile(book, `tire-shop-backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export type ImportResult = { rows: Row[]; errors: string[] };

/**
 * Parse an uploaded .xlsx/.csv file into insert payloads.
 * Headers may be the field labels (case-insensitive) or the raw column keys.
 * Tire columns accept a tire code, resolved through tireCodeToId.
 */
export async function parseExcelFile(
  file: File,
  resource: Resource,
  tireCodeToId: Map<string, string>,
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = book.Sheets[book.SheetNames[0]!];
  if (!sheet) return { rows: [], errors: ["No sheet found in the file."] };
  return parseSheet(sheet, resource, tireCodeToId);
}

/**
 * Parse a multi-tab workbook (as produced by exportAllToExcel).
 * Each tab whose name matches a resource title or table name is parsed;
 * matching is case-insensitive. Returns payloads keyed by resource table.
 */
export async function parseWorkbookFile(
  file: File,
  resources: Resource[],
  tireCodeToId: Map<string, string>,
): Promise<{ byTable: Record<string, Row[]>; errors: string[] }> {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: "array", cellDates: true });

  const byTable: Record<string, Row[]> = {};
  const errors: string[] = [];
  let matched = 0;

  for (const name of book.SheetNames) {
    const sheet = book.Sheets[name]!;
    const resource = resources.find(
      (r) =>
        r.title.toLowerCase() === name.trim().toLowerCase() ||
        r.table.toLowerCase() === name.trim().toLowerCase(),
    );
    if (!resource) continue; // unknown tab, skip
    matched++;
    const { rows, errors: sheetErrors } = parseSheet(sheet, resource, tireCodeToId);
    if (rows.length > 0) byTable[resource.table] = rows;
    for (const e of sheetErrors) errors.push(`[${name}] ${e}`);
  }

  if (matched === 0) {
    errors.push("No tabs matched a section (expected tabs like Tires, Sales, Suppliers…).");
  }
  return { byTable, errors };
}

/** Parse one worksheet into insert payloads for a resource. */
export function parseSheet(
  sheet: XLSX.WorkSheet,
  resource: Resource,
  tireCodeToId: Map<string, string>,
): ImportResult {
  const table = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  if (table.length === 0) return { rows: [], errors: [] };

  // Map spreadsheet header -> field key (accept label or key, any case)
  const headerToKey = new Map<string, string>();
  for (const field of resource.fields) {
    headerToKey.set(field.label.toLowerCase(), field.key);
    headerToKey.set(field.key.toLowerCase(), field.key);
  }

  const rows: Row[] = [];
  const errors: string[] = [];

  table.forEach((raw, index) => {
    const rowNo = index + 2; // header is row 1
    const payload: Row = {};
    const rowErrors: string[] = [];

    for (const [header, value] of Object.entries(raw)) {
      const key = headerToKey.get(header.trim().toLowerCase());
      if (!key) continue;
      const field = resource.fields.find((f) => f.key === key)!;

      if (field.type === "tire") {
        const code = String(value).trim();
        const id = tireCodeToId.get(code.toLowerCase());
        if (code && id) payload[key] = id;
        else if (code) rowErrors.push(`unknown tire code "${code}"`);
      } else if (field.type === "number") {
        payload[key] = value === "" ? 0 : Number(value);
        if (value !== "" && Number.isNaN(payload[key])) rowErrors.push(`"${value}" is not a number`);
      } else if (field.type === "date") {
        payload[key] =
          value instanceof Date
            ? value.toISOString().slice(0, 10)
            : String(value).trim() || null;
      } else {
        payload[key] = String(value).trim() || null;
      }
    }

    for (const field of resource.fields) {
      if (field.required && (payload[field.key] == null || payload[field.key] === "")) {
        rowErrors.push(`missing required "${field.label}"`);
      }
    }

    if (rowErrors.length > 0) errors.push(`Row ${rowNo}: ${rowErrors.join(", ")}`);
    else rows.push(payload);
  });

  return { rows, errors };
}

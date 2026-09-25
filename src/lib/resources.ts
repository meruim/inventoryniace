export type FieldType = "text" | "number" | "date" | "tire" | "select";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  step?: string;
  placeholder?: string;
  options?: string[];
  adminOnly?: boolean;
};

export type Resource = {
  table: string;
  title: string;
  singular: string;
  orderBy: { column: string; ascending: boolean };
  fields: Field[];
  readOnly?: boolean;
  adminWrite?: boolean;
};

export const resources: Record<string, Resource> = {
  tires: {
    table: "tires",
    adminWrite: true,
    title: "Tire master",
    singular: "tire",
    orderBy: { column: "tire_code", ascending: true },
    fields: [
      { key: "tire_code", label: "Tire code", type: "text", required: true },
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "size", label: "Size", type: "text", required: true },
      { key: "pattern", label: "Pattern / model", type: "text" },
      { key: "tire_type", label: "Tire type", type: "text" },
      { key: "load_index", label: "Load index", type: "text" },
      { key: "speed_rating", label: "Speed rating", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "supplier_name", label: "Supplier", type: "text" },
      { key: "unit_cost", label: "Unit cost", type: "number", step: "0.01", adminOnly: true },
      { key: "selling_price", label: "Selling price", type: "number", step: "0.01" },
      { key: "reorder_level", label: "Reorder level", type: "number" },
      { key: "beginning_stock", label: "Beginning stock", type: "number" },
    ],
  },
  purchases: {
    table: "purchases",
    adminWrite: true,
    title: "Purchases",
    singular: "purchase",
    orderBy: { column: "purchase_date", ascending: false },
    fields: [
      { key: "purchase_date", label: "Date", type: "date", required: true },
      { key: "po_no", label: "PO no.", type: "text" },
      { key: "supplier_name", label: "Supplier", type: "text" },
      { key: "supplier_phone", label: "Supplier contact no.", type: "text" },
      { key: "supplier_address", label: "Supplier address", type: "text" },
      { key: "payment_term", label: "Payment term", type: "select", options: ["Cash", "Credit", "Bank"] },
      { key: "tire_id", label: "Tire", type: "tire", required: true },
      { key: "qty", label: "Qty", type: "number", required: true },
      { key: "unit_cost", label: "Unit cost", type: "number", step: "0.01", adminOnly: true },
    ],
  },
  sales: {
    table: "sales",
    title: "Sales",
    singular: "sale",
    orderBy: { column: "sale_date", ascending: false },
    fields: [
      { key: "sale_date", label: "Date", type: "date", required: true },
      { key: "invoice_no", label: "Invoice no.", type: "text" },
      { key: "customer_name", label: "Customer name", type: "text" },
      { key: "customer_phone", label: "Customer phone", type: "text" },
      { key: "customer_address", label: "Customer address", type: "text" },
      { key: "tire_id", label: "Tire", type: "tire", required: true },
      { key: "qty", label: "Qty", type: "number", required: true },
      { key: "unit_price", label: "Unit price", type: "number", step: "0.01" },
      { key: "payment_mode", label: "Payment", type: "select", options: ["Full", "Partial"], required: true },
      { key: "amount_paid", label: "Amount paid", type: "number", step: "0.01" },
      { key: "unit_cost", label: "Unit cost", type: "number", step: "0.01", adminOnly: true },
    ],
  },
  adjustments: {
    table: "adjustments",
    title: "Stock adjustments",
    singular: "adjustment",
    orderBy: { column: "adjustment_date", ascending: false },
    fields: [
      { key: "adjustment_date", label: "Date", type: "date", required: true },
      { key: "reference_no", label: "Reference no.", type: "text" },
      { key: "tire_id", label: "Tire", type: "tire", required: true },
      { key: "adjustment_type", label: "Type", type: "text", placeholder: "Damaged, Lost, Returned…" },
      { key: "qty", label: "Qty (+ adds, − removes)", type: "number", required: true },
      { key: "reason", label: "Reason", type: "text" },
      { key: "approved_by", label: "Approved by", type: "text" },
    ],
  },
  transfers: {
    table: "transfers",
    adminWrite: true,
    title: "Bodega → Store transfers",
    singular: "transfer",
    orderBy: { column: "transfer_date", ascending: false },
    fields: [
      { key: "transfer_date", label: "Date", type: "date", required: true },
      { key: "reference_no", label: "Reference no.", type: "text" },
      { key: "tire_id", label: "Tire", type: "tire", required: true },
      { key: "qty", label: "Qty", type: "number", required: true },
      { key: "notes", label: "Notes", type: "text" },
    ],
  },
  suppliers: {
    table: "suppliers",
    title: "Suppliers",
    singular: "supplier",
    orderBy: { column: "supplier_id", ascending: true },
    fields: [
      { key: "supplier_id", label: "Supplier ID", type: "text", required: true },
      { key: "name", label: "Supplier name", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "payment_terms", label: "Payment terms", type: "text" },
    ],
  },
  customers: {
    table: "customers",
    title: "Customers",
    singular: "customer",
    orderBy: { column: "customer_id", ascending: true },
    readOnly: true,
    fields: [
      { key: "customer_id", label: "Customer ID", type: "text", required: true },
      { key: "name", label: "Customer name", type: "text", required: true },
      { key: "contact_no", label: "Contact no.", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "customer_type", label: "Type", type: "text", placeholder: "Walk-in, Fleet…" },
      { key: "payment_mode", label: "Payment", type: "text" },
    ],
  },
};

export const peso = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );

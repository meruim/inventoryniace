import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "Sales | Tire Shop Inventory" },
      { name: "description", content: "Record every tire sold with invoice, customer, quantity and price." },
      { property: "og:title", content: "Sales | Tire Shop Inventory" },
      { property: "og:description", content: "Record every tire sold with invoice, customer and price." },
    ],
  }),
  component: () => <ResourcePage resourceKey="sales" />,
});

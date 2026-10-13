import { createFileRoute } from "@tanstack/react-router";
import { StockLocationPage } from "@/components/StockLocationPage";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Store | Tire Shop Inventory" },
      { name: "description", content: "Store stock received from the bodega and sold to customers." },
      { property: "og:title", content: "Store | Tire Shop Inventory" },
      { property: "og:description", content: "Store stock received from the bodega and sold." },
    ],
  }),
  component: () => <StockLocationPage location="store" />,
});

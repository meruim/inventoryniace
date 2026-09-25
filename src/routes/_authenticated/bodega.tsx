import { createFileRoute } from "@tanstack/react-router";
import { StockLocationPage } from "@/components/StockLocationPage";

export const Route = createFileRoute("/_authenticated/bodega")({
  head: () => ({
    meta: [
      { title: "Bodega | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Warehouse stock from purchases and transfers out to the store.",
      },
      { property: "og:title", content: "Bodega | Niks Tirezone Inventory" },
      { property: "og:description", content: "Warehouse stock and transfers to the store." },
    ],
  }),
  component: () => <StockLocationPage location="bodega" />,
});

import { createFileRoute } from "@tanstack/react-router";
import { StockLocationPage } from "@/components/StockLocationPage";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Store | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Store stock received from the bodega and sold to customers.",
      },
      { property: "og:title", content: "Store | Niks Tirezone Inventory" },
      { property: "og:description", content: "Store stock received from the bodega and sold." },
    ],
  }),
  component: () => <StockLocationPage location="store" />,
});

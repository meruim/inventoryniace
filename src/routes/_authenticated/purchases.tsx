import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Record tire deliveries from suppliers; quantities flow into stock automatically.",
      },
      { property: "og:title", content: "Purchases | Niks Tirezone Inventory" },
      { property: "og:description", content: "Record tire deliveries from suppliers." },
    ],
  }),
  component: () => <ResourcePage resourceKey="purchases" />,
});

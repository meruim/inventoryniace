import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/tires")({
  head: () => ({
    meta: [
      { title: "Tire master | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Manage every tire you carry: code, brand, size, pattern, cost and price.",
      },
      { property: "og:title", content: "Tire master | Niks Tirezone Inventory" },
      {
        property: "og:description",
        content: "Manage every tire you carry: code, brand, size, cost and price.",
      },
    ],
  }),
  component: () => <ResourcePage resourceKey="tires" />,
});

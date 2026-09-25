import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Keep supplier contacts, addresses and payment terms in one place.",
      },
      { property: "og:title", content: "Suppliers | Niks Tirezone Inventory" },
      { property: "og:description", content: "Supplier contacts, addresses and payment terms." },
    ],
  }),
  component: () => <ResourcePage resourceKey="suppliers" />,
});

import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Walk-in and fleet customer records with contact details and addresses.",
      },
      { property: "og:title", content: "Customers | Niks Tirezone Inventory" },
      { property: "og:description", content: "Walk-in and fleet customer records." },
    ],
  }),
  component: () => <ResourcePage resourceKey="customers" />,
});

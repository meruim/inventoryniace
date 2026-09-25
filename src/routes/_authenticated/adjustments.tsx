import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ResourcePage";

export const Route = createFileRoute("/_authenticated/adjustments")({
  head: () => ({
    meta: [
      { title: "Stock adjustments | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Log damaged, lost, returned or recounted tire stock with reasons and approvals.",
      },
      { property: "og:title", content: "Stock adjustments | Niks Tirezone Inventory" },
      {
        property: "og:description",
        content: "Log damaged, lost, returned or recounted tire stock.",
      },
    ],
  }),
  component: () => <ResourcePage resourceKey="adjustments" />,
});

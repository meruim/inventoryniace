import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Niks Tirezone Inventory & Sales System" },
      {
        name: "description",
        content:
          "Online Niks Tirezone system for stock, purchases, sales, adjustments, suppliers and customers. Secure staff sign-in required.",
      },
      { property: "og:title", content: "Niks Tirezone Inventory & Sales System" },
      {
        property: "og:description",
        content: "Track tire stock, purchases, sales and profit online, with secure staff sign-in.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  ["Inventory", "Live stock per tire, with reorder and out-of-stock alerts."],
  ["Purchases", "Log deliveries; stock goes up automatically."],
  ["Sales", "Log invoices; stock goes down and profit is computed."],
  ["Adjustments", "Damaged, lost, returned or recounted stock."],
  ["Suppliers & customers", "Contact lists kept beside your records."],
  ["Dashboard", "Stock value, sales, cost of goods and gross profit."],
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-primary text-primary">
              <span className="h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="font-display text-lg font-bold uppercase tracking-widest">
              Niks Tirezone
            </span>
          </div>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="label-caps">Inventory &amp; sales system</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Your Niks Tirezone workbook,
          <span className="text-primary"> now online</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Add, edit and delete tires, deliveries, sales and stock corrections from any device. Only
          signed-in staff can see or change your data.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-display text-base font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the system
        </Link>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Niks Tirezone Inventory &amp; Sales System
      </footer>
    </div>
  );
}

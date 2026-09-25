import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listStaff, createStaff, setStaffPassword, deleteStaff } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdmin } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff accounts | Niks Tirezone Inventory" },
      {
        name: "description",
        content: "Create and manage staff sign-in accounts for the Niks Tirezone system.",
      },
      { property: "og:title", content: "Staff accounts | Niks Tirezone Inventory" },
      { property: "og:description", content: "Create and manage staff sign-in accounts." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const queryClient = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const doCreate = useServerFn(createStaff);
  const doSetPassword = useServerFn(setStaffPassword);
  const doDelete = useServerFn(deleteStaff);

  const isAdmin0 = useIsAdmin();
  const { data, error } = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetchStaff(),
    enabled: isAdmin0,
    retry: false,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const createMutation = useMutation({
    mutationFn: (input: { email: string; password: string; isAdmin: boolean }) =>
      doCreate({ data: input }),
    onSuccess: () => {
      toast.success("Staff account created.");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      invalidate();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const passwordMutation = useMutation({
    mutationFn: (input: { userId: string; password: string }) => doSetPassword({ data: input }),
    onSuccess: () => toast.success("Password updated."),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => doDelete({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account removed.");
      invalidate();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!isAdmin0 || error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Only the administrator can manage staff accounts.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Staff accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Public sign-up is disabled. Create accounts here for the people who may use the system.
        </p>
      </div>

      <form
        className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({ email, password, isAdmin });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">Email</Label>
          <Input
            id="staff-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-password">Password</Label>
          <Input
            id="staff-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating…" : "Create account"}
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-3">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
          Make this person an administrator
        </label>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Last sign in</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.isAdmin ? "Admin" : "Staff"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {u.lastSignIn ? new Date(u.lastSignIn).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pw = window.prompt(`New password for ${u.email} (min 8 characters):`);
                        if (pw) passwordMutation.mutate({ userId: u.id, password: pw });
                      }}
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Remove the account for ${u.email}?`))
                          deleteMutation.mutate(u.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

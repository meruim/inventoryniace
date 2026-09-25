import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AuthedContext = {
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  userId: string;
};

async function requireAdmin(context: AuthedContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Only administrators can manage staff accounts.");
  }
}

export type StaffAccount = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignIn: string | null;
  isAdmin: boolean;
};

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as unknown as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const adminIds = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );
    return data.users.map<StaffAccount>((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at ?? null,
      lastSignIn: u.last_sign_in_at ?? null,
      isAdmin: adminIds.has(u.id),
    }));
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        isAdmin: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as unknown as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    if (created.user) {
      const roles: { user_id: string; role: "admin" | "staff" }[] = [
        { user_id: created.user.id, role: "staff" },
      ];
      if (data.isAdmin) roles.push({ user_id: created.user.id, role: "admin" });
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(roles, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (roleError) throw new Error(roleError.message);
    }
    return { ok: true };
  });

export const setStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ userId: z.string().uuid(), password: z.string().min(8, "Password must be at least 8 characters") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as unknown as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as unknown as AuthedContext);
    if (data.userId === context.userId) {
      throw new Error("You cannot delete the account you are signed in with.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

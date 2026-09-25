import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** True when the signed-in user has the admin role (UI visibility only; the database enforces access). */
export function useIsAdmin() {
  const { data } = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      return (data ?? []).some((r: any) => r.role === "admin");
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? false;
}

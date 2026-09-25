import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps every signed-in device (admin and staff) showing the same data.
 * Listens for database changes and refreshes the cached queries.
 */
const TABLES = [
  "tires",
  "purchases",
  "sales",
  "transfers",
  "adjustments",
  "suppliers",
  "customers",
  "activity_logs",
] as const;

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("tire-shop-sync");

    for (const table of TABLES) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey: [table] });
          queryClient.invalidateQueries({ queryKey: ["inventory_view"] });
          queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
          queryClient.invalidateQueries({ queryKey: ["movements"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
      );
    }

    channel.subscribe();

    // Safety net in case realtime streaming is unavailable.
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries();
      }
    }, 15000);

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

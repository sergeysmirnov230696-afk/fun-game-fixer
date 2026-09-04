import { createFileRoute } from "@tanstack/react-router";

/**
 * Paykassa SCI IPN callback.
 * Paykassa POSTs a notification with private_hash; we confirm it via
 * sci_confirm_order and credit the matching pending deposit.
 */
export const Route = createFileRoute("/api/public/paykassa")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData().catch(() => null);
        const privateHash = String(form?.get("private_hash") ?? "");
        if (!privateHash) return new Response("no hash", { status: 400 });

        const { confirmOrder } = await import("@/lib/paykassa.server");
        let confirmed;
        try {
          confirmed = await confirmOrder(privateHash);
        } catch {
          return new Response("confirm failed", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: tx } = await supabaseAdmin
          .from("transactions")
          .select("id, player_id, amount, status")
          .eq("kind", "deposit")
          .eq("order_id", confirmed.order_id)
          .maybeSingle();
        if (!tx) return new Response("unknown order", { status: 404 });

        if (tx.status !== "done") {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "done", txn_hash: confirmed.hash })
            .eq("id", tx.id);

          const { data: player } = await supabaseAdmin
            .from("players")
            .select("id, balance")
            .eq("id", tx.player_id)
            .single();
          if (player) {
            await supabaseAdmin
              .from("players")
              .update({ balance: +(Number(player.balance) + Number(tx.amount)).toFixed(6) })
              .eq("id", player.id);
          }
        }

        return new Response("ok");
      },
    },
  },
});

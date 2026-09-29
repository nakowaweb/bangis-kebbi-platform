import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Context = { supabase: any; userId: string };

const methodCodes = ["ngn", "usdt"] as const;

export const getMyUmrahGoalDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Context;
    const [profileResult, goalResult, packagesResult, transactionsResult, settingsResult] = await Promise.all([
      ctx.supabase.from("profiles").select("*").eq("id", ctx.userId).maybeSingle(),
      ctx.supabase.from("umrah_goals").select("*").eq("user_id", ctx.userId).maybeSingle(),
      ctx.supabase.from("umrah_packages").select("*").order("sort_order"),
      ctx.supabase.from("umrah_transactions").select("*").eq("user_id", ctx.userId).order("created_at", { ascending: false }),
      ctx.supabase.from("umrah_settings").select("deposits_enabled").eq("id", 1).maybeSingle(),
    ]);

    const depositsEnabled = Boolean(settingsResult.data?.deposits_enabled);
    let rows: any[] = [];
    if (depositsEnabled) {
      const methodsResult = await ctx.supabase
        .from("umrah_payment_methods")
        .select("*")
        .eq("is_enabled", true)
        .order("sort_order");
      rows = methodsResult.data ?? [];
    }

    const methods = methodCodes.map((code) => {
      const row = rows.find((item) => item.code === code);
      const available = depositsEnabled && Boolean(row?.is_enabled);
      return {
        code,
        label: row?.label ?? (code === "ngn" ? "NGN Bank Transfer" : "USDT Transfer"),
        instructions: available ? row?.instructions ?? null : null,
        bankName: available ? row?.bank_name ?? null : null,
        accountName: available ? row?.account_name ?? null : null,
        accountNumber: available ? row?.account_number ?? row?.receiving_details ?? null : null,
        walletAddress: available ? row?.wallet_address ?? row?.receiving_details ?? null : null,
        network: code === "usdt" ? "TRC20" : null,
        available,
      };
    });

    return {
      profile: profileResult.data
        ? {
            fullName: profileResult.data.full_name as string,
            memberId: (profileResult.data.member_id as string | null | undefined) ?? null,
          }
        : null,
      goal: goalResult.data ?? null,
      packages: packagesResult.data ?? [],
      transactions: transactionsResult.data ?? [],
      depositsEnabled,
      methods,
    };
  });

export const sendActiveUmrahGoalMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ title: z.string().trim().min(2).max(160), body: z.string().trim().min(2).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Context;
    const { data: sent, error } = await ctx.supabase.rpc("send_active_umrah_goal_message", {
      _title: data.title,
      _body: data.body,
    });
    if (error) throw new Error(error.message);
    return { sent: Number(sent ?? 0) };
  });
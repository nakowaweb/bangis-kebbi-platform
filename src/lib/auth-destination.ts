import { supabase } from "@/integrations/supabase/client";

const AUTH_DESTINATION_KEY = "bangiskebbi-auth-destination";

export function safeAuthPath(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export function rememberAuthDestination(value: string | undefined): void {
  const safe = safeAuthPath(value);
  if (safe) window.sessionStorage.setItem(AUTH_DESTINATION_KEY, safe);
  else window.sessionStorage.removeItem(AUTH_DESTINATION_KEY);
}

export function takeAuthDestination(): string | undefined {
  const value = window.sessionStorage.getItem(AUTH_DESTINATION_KEY);
  window.sessionStorage.removeItem(AUTH_DESTINATION_KEY);
  return safeAuthPath(value);
}

export async function authDestination(userId: string, requested?: string): Promise<"/reset-password" | "/admin" | "/dashboard" | string> {
  const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", userId).maybeSingle();
  if ((profile as { must_change_password?: boolean } | null)?.must_change_password) return "/reset-password";
  const safe = safeAuthPath(requested);
  if (safe) return safe;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((row) => row.role as string);
  return roles.includes("super_admin") || roles.includes("admin") ? "/admin" : "/dashboard";
}
export const adminModules = [
  { id: "content", label: "Content, media & settings" },
  { id: "translations", label: "Languages" },
  { id: "social", label: "Social links" },
  { id: "credentials", label: "Credentials" },
  { id: "members", label: "Members (view only)" },
  { id: "notifications", label: "Notifications" },
  { id: "umrah", label: "Umrah" },
  { id: "foundations", label: "BK Foundations" },
] as const;

export type AdminModule = (typeof adminModules)[number]["id"];

/** Server-side module check. Super Admin always passes; other admins need an explicit grant. */
export async function requireModule(context: { supabase: any; userId: string }, module: AdminModule) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _user_id: context.userId, _module: module });
  if (error) throw new Error("Admin permissions are not set up yet. Run production_fix_v4_admin_security.sql.");
  if (!data) throw new Error("You have not been given access to this section.");
}

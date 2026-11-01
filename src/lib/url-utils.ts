/** Accepts https://, http://, www. or bare domains; prepends https:// when no protocol is given. */
export function normalizeExternalUrl(input: string | null | undefined): string {
  const value = (input ?? "").trim().replace(/\s+/g, "");
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (/^(mailto|tel):/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

/** Lowercase alphanumeric words joined by single hyphens, e.g. "Project Title!" → "project-title". */
export function slugify(input: string | null | undefined): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

/** Keeps a valid slug, otherwise derives one from the slug text or title. */
export function resolveSlug(slug: string | null | undefined, title: string | null | undefined): string {
  return slugify(slug) || slugify(title) || `item-${Date.now().toString(36)}`;
}

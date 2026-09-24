/** Renders a CMS-managed video (uploaded file or YouTube/Vimeo/https link) with its caption. */
function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    return null;
  } catch {
    return null;
  }
}

export function EntryVideo({ payload, fileUrl, title }: { payload: unknown; fileUrl?: string | null | undefined; title: string }) {
  const p = (payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}) as Record<string, unknown>;
  const link = typeof p["videoUrl"] === "string" ? (p["videoUrl"] as string) : "";
  const caption = typeof p["videoCaption"] === "string" ? (p["videoCaption"] as string) : "";
  const embed = link ? embedUrl(link) : null;
  const direct = fileUrl || (!embed && link.startsWith("https://") ? link : null);
  if (!embed && !direct) return null;
  return (
    <figure className="my-8 overflow-hidden rounded-lg border border-border bg-card">
      {embed ? (
        <iframe src={embed} title={title} className="aspect-video w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      ) : (
        <video src={direct ?? undefined} controls preload="metadata" className="aspect-video w-full bg-foreground" />
      )}
      {caption ? <figcaption className="whitespace-pre-line p-4 text-sm leading-6 text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

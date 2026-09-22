type MetaOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  canonical?: string | null | undefined;
  ogTitle?: string | null | undefined;
  ogDescription?: string | null | undefined;
  image?: string | null | undefined;
  noindex?: boolean;
};

export function pageHead({
  title,
  description,
  path,
  type = "website",
  canonical,
  ogTitle,
  ogDescription,
  image,
  noindex = false,
}: MetaOptions) {
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitle || title },
    { property: "og:description", content: ogDescription || description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical || path },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  if (image && /^https:\/\//i.test(image)) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }
  return { meta, links: [{ rel: "canonical", href: canonical || path }] };
}

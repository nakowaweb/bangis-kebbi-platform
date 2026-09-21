type MetaOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

export function pageHead({ title, description, path, type = "website" }: MetaOptions) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: path },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}

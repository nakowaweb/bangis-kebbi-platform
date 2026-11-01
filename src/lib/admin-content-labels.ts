/** Display names only: persisted content types and routing stay unchanged. */
export function adminContentLabel(contentType: string): string {
  if (contentType === "blog_post" || contentType === "blog") return "NEWS & UPDATE";
  if (contentType === "blog_category") return "News Category";
  return contentType.replaceAll("_", " ");
}
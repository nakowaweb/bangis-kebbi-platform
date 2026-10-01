import { useState } from "react";
import { Link2, MoreHorizontal, Share2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SafeImage } from "@/components/safe-image";

/** Public editorial byline for every website post; real admin identity stays in audit history. */
export const EDITORIAL_AUTHOR = "Abubakar Alhaji Abubakar";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4.9 2.9.8 3.4.7.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0z" /></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" /></svg>
);

export function SharePost({ title, url, image, label = "Share" }: { title: string; url?: string; image?: string | null; label?: string }) {
  const [open, setOpen] = useState(false);
  const link = () => url || (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Please copy it from the address bar.");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copy();
    const data: ShareData = { title, url: link() };
    try {
      if (image && navigator.canShare) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], "bangiskebbi-post." + (blob.type.split("/")[1] || "jpg"), { type: blob.type });
        if (navigator.canShare({ files: [file] })) data.files = [file];
      }
    } catch { /* image attachment is optional; the link carries preview metadata */ }
    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      try { await navigator.share({ title, url: link() }); } catch (e) { if ((e as Error).name !== "AbortError") void copy(); }
    }
  };

  const open3 = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const options = [
    { name: "WhatsApp", icon: <WhatsAppIcon />, cls: "bg-brand-green text-primary-foreground", run: () => open3(`https://wa.me/?text=${encodeURIComponent(`${title} ${link()}`)}`) },
    { name: "Facebook", icon: <FacebookIcon />, cls: "bg-primary text-primary-foreground", run: () => open3(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link())}`) },
    { name: "More", icon: <MoreHorizontal className="size-6" />, cls: "bg-secondary text-foreground", run: () => void nativeShare() },
    { name: "Copy link", icon: <Link2 className="size-6" />, cls: "bg-brand-cyan/25 text-foreground", run: () => void copy() },
  ];

  return (
    <>
      <Button className="mt-7 bg-brand-cyan text-brand-ink hover:bg-brand-cyan-soft" onClick={() => setOpen(true)}><Share2 /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-4 [&>button:last-child]:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl">Share this post</DialogTitle>
            <DialogClose className="grid size-9 place-items-center rounded-full bg-secondary" aria-label="Close"><X className="size-4" /></DialogClose>
          </div>
          <DialogDescription className="sr-only">Share options for {title}</DialogDescription>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-2">
            {image ? <SafeImage src={image} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" /> : null}
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">BangisKebbi.com</p></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {options.map((o) => (
              <button key={o.name} type="button" onClick={o.run} className="grid justify-items-center gap-1.5 rounded-md p-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring">
                <span className={`grid size-12 place-items-center rounded-full ${o.cls}`}>{o.icon}</span>{o.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

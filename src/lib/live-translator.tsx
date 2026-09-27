import { useEffect } from "react";

import { translateTexts } from "@/lib/live-translation.functions";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SELECT", "SVG", "OPTION"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const memory = new Map<string, Map<string, string>>();

function translatable(text: string) {
  const t = text.trim();
  return t.length > 1 && /\p{L}/u.test(t) && !/^(https?:|www\.|[\w.+-]+@)/.test(t);
}

function skipped(el: Element | null) {
  for (let n = el; n; n = n.parentElement) {
    if (SKIP.has(n.tagName) || n.hasAttribute("data-no-translate") || (n as HTMLElement).isContentEditable) return true;
  }
  return false;
}

/**
 * Translates the rendered page (navigation, built-in copy and CMS content) into any
 * provider-supported language, restoring the original text when the visitor switches back.
 */
export function LiveTranslator({ language }: { language: string | null }) {
  useEffect(() => {
    const root = document.body;
    const restore = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const o = originals.get(n);
        if (o !== undefined) { n.nodeValue = o; originals.delete(n); }
      }
      root.querySelectorAll("*").forEach((el) => {
        const o = attrOriginals.get(el);
        if (o) { Object.entries(o).forEach(([k, v]) => el.setAttribute(k, v)); attrOriginals.delete(el); }
      });
    };
    if (!language) { restore(); return; }

    const cache = memory.get(language) ?? new Map<string, string>();
    memory.set(language, cache);
    const applied = new WeakMap<Node, string>();
    let pending = new Set<string>();
    let timer: number | undefined;
    let cancelled = false;

    const applyText = (node: Text) => {
      const current = node.nodeValue ?? "";
      if (applied.get(node) === current) return;
      const source = originals.get(node) !== undefined && applied.get(node) !== undefined ? originals.get(node)! : current;
      if (!translatable(source) || skipped(node.parentElement)) return;
      const key = source.trim();
      const hit = cache.get(key);
      if (hit === undefined) { pending.add(key); return; }
      originals.set(node, source);
      const value = source.replace(key, hit);
      applied.set(node, value);
      node.nodeValue = value;
    };
    const applyAttrs = (el: Element) => {
      if (skipped(el) && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;
      const saved = attrOriginals.get(el) ?? {};
      for (const attr of ATTRS) {
        const source = saved[attr] ?? el.getAttribute(attr);
        if (!source || !translatable(source)) continue;
        const hit = cache.get(source.trim());
        if (hit === undefined) { pending.add(source.trim()); continue; }
        if (el.getAttribute(attr) !== hit) { saved[attr] = source; el.setAttribute(attr, hit); }
      }
      if (Object.keys(saved).length) attrOriginals.set(el, saved);
    };
    const scan = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) applyText(n as Text);
      root.querySelectorAll("[placeholder],[aria-label],[title],img[alt]").forEach(applyAttrs);
      if (pending.size) void flush();
    };
    const flush = async () => {
      const batch = [...pending].filter((t) => !cache.has(t)).slice(0, 120);
      pending = new Set();
      if (!batch.length || cancelled) return;
      batch.forEach((t) => cache.set(t, t)); // prevent duplicate requests while loading
      for (let i = 0; i < batch.length; i += 40) {
        const chunk = batch.slice(i, i + 40);
        try {
          const { translations } = await translateTexts({ data: { language, texts: chunk.map((t) => t.slice(0, 3000)) } });
          chunk.forEach((t) => cache.set(t, translations[t] ?? t));
        } catch {
          /* keep original text if the provider is unavailable */
        }
      }
      if (!cancelled) schedule();
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(scan, 120); };

    // Cached strings apply instantly; re-arm cache entries seeded as placeholders on failure.
    restore();
    scan();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => { cancelled = true; observer.disconnect(); window.clearTimeout(timer); };
  }, [language]);
  return null;
}

import { useEffect } from "react";

import { translateTexts } from "@/lib/live-translation.functions";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SVG"]);
const ATTRS = ["placeholder", "aria-label", "aria-description", "aria-valuetext", "title", "alt"] as const;
const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const memory = new Map<string, Map<string, string>>();

function translatable(text: string) {
  const t = text.trim();
  return t.length > 1 && /\p{L}/u.test(t) && !/^(https?:|www\.|[\w.+-]+@)/.test(t);
}

function textParts(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 2800) return [trimmed];
  const parts: string[] = [];
  let remaining = trimmed;
  while (remaining.length > 2800) {
    const boundary = Math.max(remaining.lastIndexOf("\n", 2800), remaining.lastIndexOf(" ", 2800));
    const end = boundary > 1400 ? boundary : 2800;
    parts.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trimStart();
  }
  if (remaining) parts.push(remaining);
  return parts;
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
    const inFlight = new Set<string>();
    let timer: number | undefined;
    let cancelled = false;
    let retryDelay = 1_000;
    let retryAfter = 0;

    const applyText = (node: Text) => {
      const current = node.nodeValue ?? "";
      const lastApplied = applied.get(node);
      if (lastApplied === current) {
        const original = originals.get(node)?.trim();
        if (!original || cache.get(original) === current) return;
      }
      const source = current;
      if (!translatable(source) || skipped(node.parentElement)) return;
      const parts = textParts(source);
      const hits = parts.map((part) => cache.get(part));
      if (hits.some((hit) => hit === undefined)) {
        parts.forEach((part, index) => { if (hits[index] === undefined) pending.add(part); });
        return;
      }
      originals.set(node, source);
      const leading = source.match(/^\s*/)?.[0] ?? "";
      const trailing = source.match(/\s*$/)?.[0] ?? "";
      const value = `${leading}${hits.join(" ")}${trailing}`;
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
      const all = [...pending].filter((t) => !cache.has(t) && !inFlight.has(t));
      const batch = all.slice(0, 120);
      pending = new Set(all.slice(120));
      if (!batch.length || cancelled) return;
      if (Date.now() < retryAfter) {
        timer = window.setTimeout(scan, retryAfter - Date.now());
        return;
      }
      batch.forEach((t) => inFlight.add(t));
      const chunks = Array.from({ length: Math.ceil(batch.length / 40) }, (_, i) => batch.slice(i * 40, i * 40 + 40));
      await Promise.all(chunks.map(async (chunk) => {
        try {
          const { translations } = await translateTexts({ data: { language, texts: chunk.map((t) => t.slice(0, 3000)) } });
          chunk.forEach((t) => cache.set(t, translations[t] ?? t));
          retryDelay = 1_000;
        } catch {
          // Provider unavailable: leave strings uncached so the next scan retries them.
          retryAfter = Date.now() + retryDelay;
          retryDelay = Math.min(retryDelay * 2, 60_000);
        } finally {
          chunk.forEach((t) => inFlight.delete(t));
        }
      }));
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

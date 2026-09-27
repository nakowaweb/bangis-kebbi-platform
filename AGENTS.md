<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- About card content and quote use `about` CMS entries (`about-card-1` through `about-card-4`, `about-quote`); built-in localized copy and Lucide icons remain safe fallbacks so the original portrait asset is never replaced by this feature.
- Homepage quick navigation uses `homepage` CMS entries named `quick-nav-home`, `quick-nav-services`, `quick-nav-umrah`, `quick-nav-projects`, `quick-nav-blog`, `quick-nav-foundation`, `quick-nav-community`, and `quick-nav-cv`; `quick-nav-community` is the CMS slot for the Verified Partners shortcut, preserving existing data while keeping a fixed safe destination.
- Reviewed public languages are centralized in `src/lib/i18n/dictionary.ts`; worldwide provider-supported options and direction metadata live in `src/lib/i18n/world-languages.ts` so URL persistence never narrows to reviewed locales.
- Live translation tracks in-flight strings separately from completed translations, because caching source placeholders can permanently prevent cold translations from reaching the rendered page.
- Legacy built-in page copy falls back to English when a newer locale has no static translation; CMS translations remain authoritative when published.
- The homepage hero uses exactly three CMS-managed slots (`hero-feature-1` through `hero-feature-3`) in a full-width stage; keep the three-second accessible carousel and bundled fallbacks without changing founder imagery.
- Approved built-in fallback visuals are bundled through Vite imports rather than Lovable-only asset paths, so self-hosted deployments retain them while CMS media remains replaceable.

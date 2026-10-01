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
- Homepage entry cards are fixed to Web Design & AI, Umrah, Business and Community in that order, while approved CMS media remains reusable elsewhere.
- Reviewed public languages are centralized in `src/lib/i18n/dictionary.ts`; worldwide provider-supported options and direction metadata live in `src/lib/i18n/world-languages.ts` so URL persistence never narrows to reviewed locales.
- Live translation tracks in-flight strings separately from completed translations, because caching source placeholders can permanently prevent cold translations from reaching the rendered page.
- Legacy built-in page copy falls back to English when a newer locale has no static translation; CMS translations remain authoritative when published.
- The homepage hero uses exactly three CMS-managed full-background slots (`hero-feature-1` through `hero-feature-3`) with no separate foreground portrait panel; keep the three-second accessible crossfade and bundled fallbacks.
- Approved built-in fallback visuals are bundled through Vite imports rather than Lovable-only asset paths, so self-hosted deployments retain them while CMS media remains replaceable.
- Permanent Member IDs are assigned and frozen by a database trigger; UUIDs remain the only internal relationship and authorization key.
- Member payment destinations are returned only when both Live Deposits and the individual method are enabled, preventing disabled details from reaching the browser.
- Google sign-in returns through the public `/auth/callback` route; only validated same-origin paths may be restored after session hydration.
- Homepage section visibility/order, motion level, EN/AR/HA text overrides and service illustration paths live in one `content_entries` row (homepage/site-layout) read via `getSiteLayout`; avoids a schema change and keeps edits in the existing CMS.
- Super Admin Umrah record corrections/deletions go through V9 SECURITY DEFINER functions (supabase/production_fix_v9_umrah_admin_records.sql): confirmation text, balance reversal and audit in one transaction; direct table UPDATE/DELETE stays denied.

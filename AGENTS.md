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
- About cards/quote use `about` CMS entries with localized fallbacks; the original portrait is never replaced.
- Homepage cards fixed: Web Design & AI, Umrah, Business, Community.
- Reviewed languages: `src/lib/i18n/dictionary.ts`; worldwide options/direction: `world-languages.ts`.
- Live translation tracks in-flight strings separately so placeholders are never cached.
- Built-in copy falls back to English; published CMS translations win.
- Hero: three CMS full-background slots (`hero-feature-1..3`), optional Settings slideshow override, bundled fallbacks.
- Fallback visuals are Vite-bundled so self-hosted deploys keep them.
- Member IDs are trigger-assigned and frozen; UUIDs stay the auth/relationship key.
- Payment destinations are returned only when Live Deposits and the method are both enabled.
- Google sign-in returns via public `/auth/callback`; only validated same-origin paths restored.
- Homepage layout, motion/speeds, EN/AR/HA overrides and service minis live in the `homepage/site-layout` content row (no schema change).
- Super Admin Umrah corrections/deletions use V9 SECURITY DEFINER functions: confirmation, balance reversal, audit in one transaction.
- Admin content-type display names use a shared browser-safe formatter; stored type keys and routes remain unchanged to preserve existing content relationships.

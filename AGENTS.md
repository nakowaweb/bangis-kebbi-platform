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
- Homepage quick navigation uses `homepage` CMS entries named `quick-nav-home`, `quick-nav-services`, `quick-nav-umrah`, `quick-nav-projects`, `quick-nav-blog`, `quick-nav-foundation`, `quick-nav-community`, and `quick-nav-cv`; this preserves fixed safe destinations while allowing managed visuals and ordering.
- Supported public languages are centralized in `src/lib/i18n/dictionary.ts`; this keeps direction, labels, persistence, interface text, CMS translation targets, and account preferences aligned.
- Supported public languages are centralized in `src/lib/i18n/dictionary.ts`; this keeps direction, labels, persistence, interface text, CMS translation targets, and account preferences aligned.

# About card polish and CMS coverage

## Goal
Preserve the existing About page, portrait, introduction, wording, layout, and all unrelated areas while refining only the four existing cards and the quote treatment. Ensure public-site content remains manageable by Super Admin through the existing secure CMS and Media Library workflows.

## About page changes
- Keep the existing portrait asset untouched; do not regenerate, edit, crop into a new file, or replace it.
- Replace the repeated checkmark treatment with four small professional Lucide icons matching the requested meanings: digital solutions, collaboration, global connections, and positive impact.
- Give each existing card a restrained semantic accent, cleaner visual hierarchy, and subtle hover/entrance motion that respects reduced-motion settings.
- Add a small quote icon and premium, subtle styling to the existing quote while keeping it attached to the portrait area.
- Preserve all current About wording, actions, responsive structure, and page sections.

## CMS coverage
- Add four dedicated About card entries and one About quote entry to the existing content lifecycle so Super Admin can edit text, order items, show/hide, archive, restore, and permanently delete where existing permissions allow.
- Let each About card optionally use a Media Library image/icon; retain the professional built-in icon when no media is selected.
- Connect the About page to published CMS entries while retaining current EN/AR/HA wording as safe fallbacks.
- Keep the portrait unchanged on the public page; preserve the existing protected media, authentication, storage, role checks, audit logging, and RLS architecture.
- Audit the named public areas and close only concrete CMS wiring gaps using the current content editor, settings, credential manager, Foundation manager, Umrah manager, and Media Library rather than adding parallel administration systems.

## Verification
- Check the About page at desktop and mobile sizes for preserved content, correct portrait, card/quote polish, no overlap, and reduced-motion behavior.
- Confirm published About card ordering/visibility and secure media resolution in source-level flows; test authenticated controls if a Super Admin session is available.
- Run the TypeScript check and confirm the latest preview build is healthy.

## Technical details
- Use existing semantic design tokens, Lucide icons, `SafeImage`, `content_entries`, signed private `site-media` URLs, and the existing Super Admin content lifecycle.
- Do not modify authentication, database schema, storage visibility, RLS policies, routes, or unrelated public sections.

# Master Production Content, UX and CMS Update

## Goal
Turn the existing BangisKebbi.com experience into a complete, credible personal-brand portfolio while preserving its visual identity, authentication, private documents, data security, multilingual architecture, and Hostinger setup.

## Public experience
- Make all six service cards link to CMS-backed detail pages for AI Web Design, Web Development, UI/UX Design, WordPress Development, Digital Business Solutions, and Website Maintenance.
- Give each service page a polished introduction, relevant local visual, capability list, audience, working process, and functional contact actions using configured site details.
- Expand the projects catalogue to eight working case-study pages: BangisKebbi.com plus seven clearly labelled concept/demo projects. Reuse the three existing project images and create a cohesive local visual set for the five new concepts.
- Complete blog article pages with category, author, publication date, safe featured/gallery media, related posts, share actions, and a contact prompt.
- Replace the Umrah public page with the requested honest support journey, official-provider limitation, document/review/preparation/refund/contact sections, and working Explore, Register, and Contact actions.
- Replace BK Foundations wording with the supplied humanitarian mission, vision, support areas, six-step process, privacy statement, impact updates, and working community/contact actions.
- Add a premium `/cv` page with the supplied professional profile, capabilities, experience, projects, strengths, driving licence, availability, configured contacts, and print/download-friendly presentation.
- Replace the Privacy, Terms, and Refund placeholders with original, tailored policies covering every requested topic without unverified legal or compliance claims.
- Ensure About, Community, Contact, footer, and homepage links use the same configured contact/social data and that all prominent actions reach a real destination.

## CMS and content lifecycle
- Extend the existing content types to include CV, Privacy Policy, Terms, and Refund Policy without changing existing security architecture.
- Seed the required English service, project, Umrah, Foundation, CV, and legal content as idempotent CMS records so the first production deployment contains the requested pages.
- Seed separate published Arabic and Hausa translations for the new production content; keep each language isolated in the existing translation table.
- Preserve the existing translation workspace and its automatic draft-only workflow; generated translations still require administrator review before publishing.
- Add explicit restore and permanent-delete actions with confirmation to the content editor. Permanent deletion remains Super Admin-only and is enforced server-side; archiving remains reversible.
- Keep draft, publish, unpublish, archive, schedule, publication time, display order, preview, media, SEO, and translation controls in the existing admin workspace.
- Expand preview mapping so all CMS-managed areas can be opened from the editor.
- Keep Foundation project management in its existing dedicated admin area while making its public explanatory sections editable through the main CMS.

## Language and content safety
- Add English, Arabic, and Hausa wording for every new fixed label, heading, button, empty/error state, legal section, CV section, Umrah section, Foundation section, project label, and article control.
- Keep selector order exactly English, العربية, Hausa; English remains default; Arabic remains RTL and Hausa remains LTR.
- Preserve `?lang=en|ar|ha` routing, local visitor persistence, member preference syncing, and locale-aware CMS reads.
- Remove the prohibited English word from all user-facing source and database seed content, including older fallback text, while retaining clear factual wording.
- Do not translate or expose private member records, Umrah documents, internal notes, drafts, archived items, or unpublished content.

## SEO and discovery
- Give `/cv` and every public/static/detail page unique localized titles, descriptions, canonical URLs, Open Graph data, Twitter cards, and EN/AR/HA/x-default alternates.
- Add localized breadcrumb structured data to services, projects, blog articles, Foundation details, CV, and legal pages where appropriate.
- Include `/cv` and every eligible seeded detail URL in the localized sitemap; restrict database-derived sitemap rows to published, enabled, non-archived content.
- Preserve private-route exclusions in robots and sitemap.
- Use share images only when a valid absolute image URL is available; bundled local images stay visible on-page without invalid social-image tags.

## Media and interactions
- Keep every current brand asset local and use `SafeImage` for all CMS and gallery images.
- Generate and bundle five new project concept visuals; never depend on deleted storage objects or external hotlinks.
- Keep `site-media`, Foundation media, and `member-documents` private; do not alter their access policies.
- Resolve email, phone, WhatsApp, and social actions from site settings/social management rather than placeholder URLs.
- Add print-specific CV styling and a Download CV action that opens the browser print/save workflow without adding document-generation infrastructure.

## Verification
- Run the TypeScript check and production build.
- Test every requested service, project, blog, Umrah, Foundation, contact, and CV action in the browser.
- Test direct URLs, reloads, English/Hausa/Arabic switching, Arabic RTL, SEO tags, sitemap contents, console errors, broken images, and horizontal overflow at 360, 390, 430, and desktop widths.
- Test the real Super Admin workspace for editing, media selection/upload flow, translation controls, scheduling, publish/unpublish/archive, restore, delete confirmation, social links, and SEO fields without changing existing production accounts or content outside this scope.
- Confirm anonymous visitors cannot access `/dashboard` or `/admin`, and cannot retrieve unpublished/private content.
- Save the final source changes so Lovable’s GitHub synchronization can place them on `main`; report the resulting commit visible in the synced repository. Do not deploy to Hostinger.

## Technical details
- Continue using the existing TanStack Start dynamic routes (`/services/$slug`, `/projects/$slug`, `/blog/$slug`) rather than creating duplicate route files for each slug.
- Extend the current content schema and validation with one migration; retain existing grants and RLS policies unchanged.
- Use idempotent inserts keyed by content type/slug, with separate translation rows keyed by content entry/language.
- Add small shared presentation/data helpers for structured content, configured contact links, detail layouts, localized fixed copy, and related-post loading rather than duplicating page logic.
- Do not modify authentication, role bootstrap, Umrah document security, notification/activity behavior, deployment runtime, or storage visibility.

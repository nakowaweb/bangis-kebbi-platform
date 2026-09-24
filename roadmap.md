# Roadmap

## Done
- Multilingual system (EN / AR / HA) with `?lang=` localized public URLs, controlled dictionary, Arabic RTL.
- Language selector order: English, العربية, Hausa. hreflang mapping stays en / ar / ha.
- Locale-aware public CMS reads (services, projects, blog, homepage, about, Umrah, BK Foundations) with English fallback.
- Super Admin translation workspace in /admin (draft / ready / published / unpublished / archived) with AI-generated drafts that are never auto-published.
- Super Admin social link manager in /admin (8 platforms, add/edit/enable/disable/reorder/remove, URL validation, admin-only).
- Localized SEO: per-language title/description, canonical, OG, hreflang + x-default, localized sitemap.
- Member dashboard navigation localized; private records never machine-translated.

## Notes
- Pre-existing security-linter warnings on `claim_first_super_admin` and `create_system_notification` (SECURITY DEFINER executable by signed-in users) were left untouched to avoid breaking auth and notifications.

## Master production content, UX and CMS update
- [x] Complete six CMS-backed service detail experiences and links
- [x] Complete eight project case studies with concept/demo labels and visuals
- [x] Complete blog details, Umrah, BK Foundations, contact actions and media fallbacks
- [x] Add multilingual CV and production legal pages
- [x] Extend CMS lifecycle controls with draft preview, archive/restore and Super Admin permanent delete
- [x] Add controlled EN/AR/HA production fallbacks and update SEO/sitemap/internal links
- [x] Keep legal pages and CV editable through existing CMS content types, avoiding a production database schema change
- [x] Verify public interactions, languages, RTL, 360/390/430/desktop layouts, security boundaries, typecheck and production build
- [ ] Verify authenticated Super Admin controls against production — blocked because the connected external production database is unreachable from this workspace
- [ ] Confirm GitHub main synchronization — current workspace branch is not main and repository pushes are platform-managed
## Final production polish
- [x] Apply confirmed WhatsApp, email and LinkedIn fallbacks across public contact actions
- [x] Add confirmed social links as safe public defaults while preserving database-managed overrides
- [ ] Save confirmed social links and location in production data — blocked by unavailable database connection
- [ ] Raise the private site-media bucket and media record limits to 50 MB — blocked by unavailable database connection
- [x] Confirm Super Admin CMS and social controls in source
- [x] Add restrained motion with reduced-motion support
- [ ] Verify social links, routes, mobile/desktop, TypeScript, production build, and repository status

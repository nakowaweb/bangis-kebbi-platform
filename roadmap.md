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
- [ ] Complete six CMS-backed service detail experiences and links
- [ ] Complete eight project case studies with concept/demo labels and visuals
- [ ] Complete blog details, Umrah, BK Foundations, contact actions and media fallbacks
- [ ] Add multilingual CV and production legal pages
- [ ] Extend CMS lifecycle controls, content types, previews, restore and Super Admin delete
- [ ] Seed EN/AR/HA production content and update SEO/sitemap/internal links
- [ ] Verify all public/admin interactions, languages, RTL, viewports, security, typecheck and build
- [ ] Confirm final GitHub main synchronization

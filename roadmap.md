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

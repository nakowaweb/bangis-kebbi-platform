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
- [ ] Save confirmed social links and location in production data — blocked by unavailable database connection
- [ ] Raise the private site-media bucket and media record limits to 50 MB — blocked by unavailable database connection
- [x] Confirm Super Admin CMS and social controls in source
- [x] Add restrained motion with reduced-motion support
- [x] Verify public routes and mobile/desktop rendering; all requested routes return 200 with no overflow or broken images
- [ ] Verify all database-managed social rows, TypeScript, production build, and GitHub main push — blocked by unavailable production database and platform-managed repository publishing

## Final company credentials and launch polish
- [x] Add a public Company Credentials section with neutral CAC registration wording, RC 9884960, independent CAC search and a responsive document viewer
- [x] Add a dedicated Super Admin credential workspace using existing content lifecycle controls, ordering, document replacement, archive/restore and confirmed deletion
- [x] Add canonical seven-link public social display with responsive icon grid and centralized database-first fallbacks
- [x] Add staged hero copy, CTA, portrait, location badge, grid and shared card motion with reduced-motion handling
- [x] Confirm Kebbi State, Nigeria and the required public CV facts; no school or university claims added
- [x] Pass TypeScript and production builds; pass public route, image, overflow, link and console checks at 360px and 1280px
- [ ] Verify signed-in Super Admin changes and save production location/social/credential rows — blocked because this workspace has no production data connection
- [ ] Push the generated commit to GitHub main — blocked because repository synchronization is platform-managed and main remains behind the workspace commit

## Final functional polish
- [x] Add a five-slide hero carousel with visible crossfade/slide motion, controls, indicators, pause, swipe and reduced-motion support
- [x] Add public-only global Site Search with built-in and CMS content, credential matching, images and direct links
- [x] Add optional Google Programmable Search Engine CX configuration with a graceful unconfigured state
- [x] Update the initial CAC credential facts without fabricating the official certificate
- [ ] Verify authenticated Super Admin changes against production — blocked because this workspace has no production data connection
- [ ] Synchronize the final workspace commit to GitHub main — repository publishing remains platform-managed

- [x] Create and install the founder-referenced Umrah/community visual in the homepage carousel and Umrah section
- [x] Preserve the original first hero image, update all four supporting visuals from the founder reference, and make their CMS slots replaceable
- [x] Increase hero autoplay to 2.7 seconds with smooth transitions and reduced-motion support

## Media Library visual gallery
- [x] Replace the file list with image-first and playable-video cards
- [x] Add filename search, media-type filtering and archive-state filtering
- [x] Add direct upload, same-kind replacement, remove-from-content, archive/restore and protected permanent deletion controls
- [ ] Verify authenticated Media Library workflows against production — blocked when no production admin session is available

## Services reference-card update
- [x] Rebuild only the Services section as six responsive image-led cards matching the supplied reference
- [x] Create six distinct service visuals and keep CMS-managed images as the public-card priority
- [ ] Register the six built-in visuals in the production Media Library — blocked when no production admin session is available

## BK Community Support Initiative reference-card update
- [x] Rename public BK Foundations references to BK Community Support Initiative
- [x] Rebuild the public support-program area as ten responsive image-led cards
- [x] Prioritize secure CMS media paths with distinct bundled image fallbacks
- [ ] Register the ten built-in visuals in the production Media Library — blocked when no production admin session is available

## BK Community Support Initiative Mission & Vision update
- [x] Rebuild only Mission and Vision as responsive image-backed cards matching the supplied reference
- [x] Add distinct humanitarian and hopeful-family fallback visuals
- [x] Connect both cards to the existing CMS image path and secure display workflow
- [ ] Register the two built-in visuals in the production Media Library — blocked when no production admin session is available

## Four-slide homepage hero update
- [x] Create four founder-led hero scenes for Digital Solutions, Community Support, Umrah Support and Global Opportunities
- [x] Replace the public fallback rotation with exactly four responsive slides and preserve the 2.7-second accessible carousel behavior
- [x] Connect all four slides to distinct Homepage/Hero CMS entries with ordering, publish/unpublish, replacement and removal controls
- [ ] Register the four images in the production Media Library — blocked when no production admin session is available

## Business card small visuals
- [ ] Add five small, proportional visuals matching the supplied reference to the existing Business cards
- [ ] Connect each visual to a distinct CMS entry for Media Library preview, replacement and removal
- [ ] Verify the Business cards on desktop and mobile without changing other sections
- [ ] Register the five images in the production Media Library — blocked when no production admin session is available

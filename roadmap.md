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
- [x] Add five small, proportional visuals matching the supplied reference to the existing Business cards
- [x] Connect each visual to a distinct CMS entry for Media Library preview, replacement and removal
- [x] Verify the Business cards on desktop and mobile without changing other sections
- [ ] Register the five images in the production Media Library — blocked when no production admin session is available

## Blog reference-card update
- [x] Split the supplied three-panel artwork into three exact, unmodified photographic crops
- [x] Replace the three fallback article images and match the reference card content and actions
- [x] Add the CMS-managed blog author profile photo to Website Settings
- [ ] Register the three images and author profile photo in the production Media Library — blocked when no production admin session is available

## Umrah reference-section update
- [x] Match the supplied journey layout with eight small, proportional illustrations
- [x] Match the supplied important-information layout with six small illustrations
- [x] Present the support-balance explanation with an Umrah visual and no sample financial figures
- [x] Connect all fifteen visuals to Umrah CMS entries for Media Library replacement or removal
- [ ] Register the fifteen visuals in the production Media Library — blocked when no production admin session is available

## Projects final professional update
- [x] Match the supplied three-column image-led project card direction across all eight projects
- [x] Create distinct premium visuals for the corporate and service-company projects
- [x] Make every project image and prominent action open its project details page
- [x] Expand all eight project details with purpose, key features, demonstrated skills, status and future live-link space
- [x] Preserve CMS and Media Library replacement controls, security and unrelated page design
- [x] Verify eight cards and all detail links on desktop and mobile
- [ ] Register new project visuals in the production Media Library — blocked when no production admin session is available

## Homepage community-support banner
- [x] Upgrade only the homepage BK Community Support Initiative section to the supplied premium banner direction
- [x] Preserve the supplied image unchanged as the fallback visual and connect the section to its existing CMS image field
- [x] Add the four requested visual points and keep the existing initiative CTA and route
- [ ] Register the supplied banner in the production Media Library — blocked when no production admin session is available

## Final compact CAC credential card
- [x] Replace the large public credential card with the supplied compact CAC design
- [x] Keep certificate viewing, official verification and CMS-managed credential data working
- [x] Verify responsive presentation and production build health

## About card polish and CMS coverage
- [x] Preserve the existing About page, portrait, introduction, text, layout and unrelated content
- [x] Add distinct professional icons and subtle premium styling to the four existing About cards
- [x] Refine the existing quote treatment with a small quote icon while keeping it attached to the portrait
- [x] Connect About cards/quote and optional media to the existing Super Admin CMS lifecycle
- [x] Audit the named public content areas and close the requested About CMS wiring gap without changing security or routes
- [x] Verify desktop/mobile presentation, reduced motion, TypeScript and preview build health

## Homepage quick navigation reference upgrade
- [x] Extract the eight approved 3D visuals directly from the supplied reference without regeneration
- [x] Preserve the navy section, eight-card arrangement and fixed existing destinations
- [x] Connect each visual to a stable Homepage CMS entry with replacement, removal, ordering and visibility controls
- [x] Verify desktop, tablet and mobile rendering, active glow, links, overflow, console and build health
- [ ] Register the eight entries in the production Media Library — blocked when no production admin session is available

## Multilingual header and managed languages
- [x] Reproduce the approved desktop, tablet and mobile language selector without changing other header elements
- [x] Extend working site translations from EN/AR/HA to FR/ES/TR/DE/UR/ZH with Urdu RTL and English fallback
- [x] Add secure Super Admin controls for language availability and future additions
- [x] Extend CMS dynamic-content translation management to every enabled language
- [x] Verify persistence, page navigation, RTL/LTR switching and responsive layout
- [x] Restore the existing backend schema and verify the complete nine-language type surface

## Language markers and account-page copy
- [x] Add a representative flag or neutral language icon beside every language option
- [x] Replace the public Login and Registration descriptions without changing access controls

## Final homepage hero reference update
- [x] Recompose the homepage hero as the approved full-width visual stage without changing its wording, brand, header, navigation or photos
- [x] Use exactly three existing CMS-managed hero images with three-second automatic transitions and manual controls
- [x] Add non-obstructive globe and technology motion with reduced-motion support
- [x] Verify desktop, tablet, iPhone and Android layouts, translations, controls, images, motion, overflow and preview health
- [x] Confirm repository synchronization remains platform-managed without publishing or changing production data

## Hostinger production asset restoration
- [x] Replace deployment-specific fallback asset URLs with production-portable bundled files for quick navigation, credentials, Umrah, Projects and Blog visuals
- [x] Preserve CMS-managed images while making broken or unavailable managed links fall back to the approved visuals
- [x] Restore the exact About introduction above the existing portrait and feature cards
- [x] Set the homepage hero to three-second automatic transitions using the existing three managed slots and bundled approved fallbacks
- [x] Move verified partners higher on the Umrah page and add header/homepage shortcuts to its real section
- [x] Verify affected images, language options, live translation, navigation and responsive layouts without changing production data

## Complete worldwide translation reliability
- [x] Preserve every supported worldwide language in the URL across navigation and refresh
- [x] Prevent untranslated request placeholders from blocking cold translation results
- [x] Translate long content without truncation/key mismatches and back off safely during provider failures
- [x] Preserve the active language automatically across every internal navigation
- [x] Verify Japanese and Portuguese on desktop/mobile, Arabic RTL, active-language display, navigation and refresh
- [x] Umrah landing page from approved design + /partners page (real member data only, payments off)
- [x] Partner WhatsApp + per-field public visibility (phone/WhatsApp/email)
- [x] Umrah + Partners slides and carousel intervals registered in Website Content and Media Library
- [ ] Admin editing walkthrough — blocked: no Super Admin account exists in this backend

## Umrah Goal reference-matched member page
- [x] Implement permanent server-generated Member IDs without changing internal UUIDs
- [x] Match the approved navy/blue goal dashboard using real saved amounts only
- [x] Add locked NGN/USDT previews and reveal configured destinations only when enabled
- [x] Add Super Admin messaging for active goal members with audit logging
- [x] Verify desktop/mobile, disabled-payment security and available authenticated flows
- [ ] Apply the reviewed database migration — blocked pending explicit production approval

## Umrah Goal payment cards and Google return flow
- [x] Replace payment symbols and reduce each disabled method to one Coming soon state
- [x] Add a public Google callback with safe member/admin destination handling
- [ ] Verify Google sign-in on bangiskebbi.com — blocked until the production callback is allow-listed and reviewed
- [ ] Publish the reviewed changes — blocked pending explicit production approval

## Approved cinematic homepage review
- [ ] Match the approved navy/cyan/green/gold homepage reference on laptop, tablet and phone
- [ ] Keep the approved portrait, three managed slides, exact four-card order and working destinations
- [ ] Show only published CMS case studies and approved media; never publish reference placeholders as claims
- [ ] Add draft/published media captions and lifecycle controls with safe replacement/deletion
- [ ] Verify navigation, carousel, gallery, dashboard, EN/AR/HA, RTL and reduced motion
- [ ] Capture desktop, tablet and phone review screenshots without deploying production

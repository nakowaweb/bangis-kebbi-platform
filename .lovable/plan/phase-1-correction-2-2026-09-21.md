# Phase 1 Correction #2

## Goal
Correct the public profile location and preserve the approved visual direction while adding a secure, content-focused Super Admin system. Payments, KYC, private travel documents, contribution processing, and other sensitive workflows remain out of scope.

## Public website corrections
- Replace the profile location with **Abuja, Nigeria** and retain **Working globally**.
- Keep the existing owner-provided portrait file as the source in the hero and About section; do not regenerate, redraw, retouch, or replace it.
- Keep the official BangisKebbi.com logo asset in the header and footer.
- Ensure the design reference screenshot is never imported, rendered, or served as page content.
- Preserve the approved hero composition, with responsive positioning that keeps the portrait naturally framed on desktop and mobile.
- Keep the public pages short, visual, fast, and unchanged in overall direction.

## Super Admin content management
Enable Lovable Cloud and add a protected Super Admin dashboard for content only:
- **Homepage:** hero text and image selection, CTAs, categories, featured content, section summaries, and visibility/order.
- **About and settings:** biography, title, profile image, social links, site identity, logo, favicon, contact details, location, footer, language, and SEO fields.
- **Services, projects, posts, business categories, Umrah information, FAQs/notices, and Foundation initiatives/updates:** create, edit, reorder, enable/disable, draft, publish/unpublish, and delete with confirmation where applicable.
- **Media library:** upload, browse, select, replace, and remove unused images. Mark the official portrait and core brand assets as protected; replacing or deleting one requires an explicit warning confirmation.
- **Safety:** revisions for editable content, last-updated details, soft deletion/restore where practical, and an audit log containing admin, action, time, and affected content.

## Access and security
- Use authenticated, server-validated Super Admin access with roles stored separately from user profiles.
- Keep all content-management pages behind the protected dashboard area.
- Separate content/settings from system configuration; never expose credentials, authentication configuration, service keys, payment secrets, or server settings.
- Validate uploads and editor inputs, apply row-level access rules, and prevent unverified legal/official claims from being published in Umrah partner fields.
- Preserve the existing disclaimers: Business and BK Foundations are not investments, and Umrah does not claim visa or operator authority.

## Public delivery and performance
- Read only published/enabled content on public pages, with small explicit queries and safe fallback content during rollout.
- Keep the hero image eager; lazy-load below-the-fold media and use responsive dimensions.
- Paginate larger dashboard lists and provide loading, empty, error, draft, published, and disabled states.
- Avoid exposing dashboard structure or management data to public visitors.

## Verification
- Confirm desktop and mobile hero layouts, including the original portrait, official logo, **Abuja, Nigeria**, and **Working globally**.
- Search the delivered public code and rendered pages to confirm no profile reference to Muscat, Oman and no design-reference screenshot.
- Exercise Super Admin sign-in, editing, draft/publish, delete confirmation, protected-media confirmation, settings update, and audit-log creation.
- Verify public content updates after publishing, no horizontal overflow, no missing images, no console/network errors, and clean typecheck/build checks.

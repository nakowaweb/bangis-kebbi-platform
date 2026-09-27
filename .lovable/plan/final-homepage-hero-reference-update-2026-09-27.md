# Final Homepage Hero Reference Update

## Goal
Recreate only the homepage hero as the approved full-width design while preserving the existing BangisKebbi.com header, branding, wording, real founder imagery, multilingual controls, links, data and administrator workflows.

## Implementation
- Replace the current split text-and-image hero with one full-width visual stage: rotating image backdrop, readable navy overlay, left-aligned headline and actions, and the existing location badge and slide controls.
- Use exactly three published `hero-feature-1` through `hero-feature-3` Homepage/Hero entries, ordered by the existing CMS settings; retain three bundled versions only as reliable fallbacks when managed media is unavailable.
- Keep “Creating Possibilities Beyond Borders” and “Connecting people, technology and opportunities” unchanged, with the existing Hire Me and Explore My Work destinations.
- Change automatic rotation to one second, with smooth fade/slide motion, pause on interaction, swipe and manual previous/next/indicator controls.
- Add small animated globe, technology and people-connection accents positioned away from the headline, using lightweight CSS motion that turns off when reduced motion is requested.
- Update only the existing importer guidance and fallback registration from four hero slots to three; do not change the database schema or production records.
- Preserve the existing English, Arabic, Hausa and More Languages header controls and RTL behavior at every size.

## Technical Details
- Keep hero media managed through the current private Media Library paths and signed display links.
- Keep the founder photos unchanged; apply layout cropping only through responsive `object-fit: cover` and focal positioning.
- Keep semantic design tokens and the existing button components; no new image generation or uploaded-reference reuse.
- Record the three-slot hero contract in the project architecture notes.
- Repository commits and GitHub synchronization remain platform-managed; no manual push or deployment will be run.

## Quality Checks
- Verify the three-slide order, one-second automatic change, controls, pause/swipe behavior and no legacy fourth slide.
- Verify readable, non-duplicated copy and non-overlapping animated accents on desktop, tablet, iPhone and Android widths.
- Verify English, Arabic, Hausa, More Languages and RTL behavior remain functional.
- Verify reduced-motion mode removes continuous and transition motion while keeping content usable.
- Check images, links, overflow, browser errors and the latest preview build; do not publish or modify production data.
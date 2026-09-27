# Homepage quick navigation upgrade

## What will change
- Keep the existing navy section and eight-card arrangement, while matching the attached reference’s card proportions, compact imagery, typography, borders, spacing, and active cyan glow.
- Replace the current line icons with the eight approved 3D visuals taken directly from the supplied reference: Home, Services, Umrah, Projects, Blog, BK Community Support Initiative, Community, and CV.
- Preserve every existing destination and add only subtle hover/entrance motion with reduced-motion support.

## Content and media management
- Add one `homepage` CMS entry per quick-navigation card, using stable `quick-nav-*` slugs.
- Let Super Admin upload, replace, remove, reorder, enable/disable, archive, or delete each visual through Website Content and the existing Media Library.
- Public rendering will prioritize published CMS images while retaining the approved reference crops as reliable built-in fallbacks.

## Verification
- Confirm all eight cards and destinations on desktop, tablet, and mobile.
- Confirm active-card glow, image cropping/alignment, text wrapping, reduced-motion behavior, and no overflow or console errors.
- Confirm the current build remains healthy without changing authentication, database structure, security, or unrelated sections.

## Technical details
- Extract the eight visual tiles from the supplied image without regenerating or redesigning them, then store them through the project asset flow.
- Pass managed homepage quick-navigation entries from the existing homepage content loader into the quick-navigation renderer.
- Extend the current secure importer with the eight entries; no schema or policy changes are required.

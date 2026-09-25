# Four-Slide Homepage Hero Update

## Goal
Replace the active homepage carousel with four professional, founder-led slides matching the supplied four-panel reference, while preserving the founder’s real identity and the existing BangisKebbi.com brand.

## Implementation
- Create four separate hero images for Digital Solutions, BK Community Support Initiative, Umrah Support Program, and Global Platform / Opportunities.
- Use the existing official founder portrait as the identity source for every founder appearance; preserve facial structure, features, and natural skin tone while improving only scene, lighting, clothing, and composition.
- Replace the built-in carousel fallbacks and public carousel selection with exactly four new CMS slots, removing prior hero assets from active rotation without deleting unrelated media.
- Keep the existing automatic 2.7-second transition, controls, swipe support, pause behavior, and reduced-motion support.
- Adjust image framing for wide desktop, tablet, and mobile displays without obscuring the key subject.
- Register the four built-in images through the existing Media Library importer as Homepage/Hero entries so Super Admin can preview, replace, reorder, enable/disable, or remove them using current controls.
- Do not change the database schema, RLS, authentication, Admin permissions, or unrelated sections.

## Quality Checks
- Verify exactly four active slides, correct order and labels, smooth transitions, and no legacy image in the active rotation.
- Verify desktop and mobile framing, no broken images or horizontal overflow, and working controls.
- Confirm Media Library and Homepage/Hero wiring uses existing secure media paths and content controls.
- Check the preview for browser errors and a clean build.

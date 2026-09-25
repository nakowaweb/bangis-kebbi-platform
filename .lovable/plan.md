# Projects final professional update

## What will change
- Keep the existing Projects page structure, branding, filters and eight-project content model.
- Restyle only the project cards to closely follow the supplied reference: consistent landscape imagery, concise unique copy, a prominent full-width “View Project” action and restrained premium motion.
- Make each project image and action open the same Project Details page.
- Retain the first six project directions and create two new matching professional visuals for the Corporate Business and Service Company concepts.
- Expand every project detail page with project-specific concept, purpose, key features, demonstrated technologies/skills, honest status and a reserved live-demo/website area.

## Content and media management
- Keep each project mapped to its existing CMS slug so Super Admin can upload, preview, replace or remove its image through Content → Projects and the Media Library.
- Add the two new fallback visuals to the existing secure current-site importer without changing database tables, access policies or private media handling.

## Verification
- Confirm exactly eight cards, eight unique images and eight unique descriptions.
- Test image and button navigation to all eight detail pages.
- Check desktop and mobile presentation, image loading, motion, overflow, console errors and the current build status.

## Technical details
- Update the shared project-card renderer and fallback project definitions rather than redesigning the whole page.
- Preserve CMS content as the priority over bundled fallbacks and keep reduced-motion behavior intact.
- No database, authentication, RLS or unrelated Admin changes.

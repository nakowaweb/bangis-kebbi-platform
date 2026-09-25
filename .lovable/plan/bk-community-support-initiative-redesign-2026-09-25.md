# BK Community Support Initiative redesign

## Scope
- Rename public-facing “BK Foundations” wording to “BK Community Support Initiative” while keeping the existing `/foundation` URLs, data model, permissions, and admin workflows unchanged.
- Restyle only the public initiative index and project-detail wording to follow the supplied image-led humanitarian reference.
- Keep all ten existing support programs and multilingual copy.

## Implementation
- Create ten distinct, professional humanitarian support images matching each program and the existing blue/green brand direction.
- Render each program as a responsive image-first card with its title, concise description, and relevant icon.
- Prefer each published `foundation_what_we_do` CMS entry’s securely signed `image_path`; use the new bundled visual only when no CMS image is assigned.
- Preserve the existing Content Editor and Media Library workflow so Super Admin can upload, preview, replace, or remove every program image without storing signed URLs.
- Update public navigation/SEO/project-detail labels that currently show “BK Foundations”; no database or RLS changes.

## Verification
- Check desktop and mobile layouts, all ten images, responsive overflow, broken images, public links, console errors, and TypeScript/build status.

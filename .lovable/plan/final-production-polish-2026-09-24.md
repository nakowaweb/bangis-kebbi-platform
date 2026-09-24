# Final production polish

## Public experience
- Refine the existing homepage hero with staged headline, CTA, portrait, badge, and background movement while preserving readability and reduced-motion behavior.
- Add a lower-homepage Company Credentials section seeded with BANGISKEBBI GLOBAL LIMITED, RC 9884960, CAC Nigeria, neutral wording, certificate viewing, and the official CAC search as an independent verification route.
- Make the footer/mobile social area render the centrally configured LinkedIn, Facebook, TikTok, Instagram, YouTube, WhatsApp, and Email links in the requested order with accessible SVG icons.
- Apply restrained shared entrance and hover motion to public cards and buttons.

## Super Admin
- Add Company Credentials as a dedicated workspace using the existing authenticated content/media architecture.
- Support title, issuer, number, dates, description, verification URL, visibility, order, PDF/image document upload or replacement, preview, draft/publish scheduling, unpublish, archive, restore, and confirmed permanent deletion.
- Preserve existing role checks, private member-document boundaries, social management, translations, and normal no-deployment CMS updates.

## Content consistency
- Remove remaining public Abuja references and keep Kebbi State, Nigeria in homepage, About, Contact, CV, footer/profile, and relevant metadata.
- Preserve the required CV identity, role, driving licence, and experience details without adding education claims.

## Verification
- Check service, project, blog, Umrah, Foundation, social, credential, and CV actions on mobile and desktop.
- Check overflow, images, links, console/network errors, TypeScript, and the production build.
- Verify repository status and report the actual final commit and GitHub main state without claiming an unavailable push.

## Technical details
- Model credentials as a dedicated CMS content type with structured payload fields, using signed URLs from the private `site-media` bucket for public document viewing.
- Extend media validation to PDFs plus supported images while leaving `member-documents` and its policies unchanged.
- Use existing semantic design tokens, Button components, translation patterns, lifecycle functions, and audit logging.

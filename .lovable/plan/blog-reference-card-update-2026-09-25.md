# Blog reference-card update

## Goal
Use the supplied three-panel artwork without visual alteration, splitting its three photographic panels into exact crops for the existing Digital Opportunities, AI & Design, and Business articles.

## What will change
- Crop the three top photographs directly from the uploaded image; do not regenerate, retouch, recolor, or alter them.
- Rebuild only the public blog cards to match the reference: image-led cards, supplied titles and descriptions, author row with publication date, and a prominent “Read Article” button.
- Make each entire card and its button open the existing article page, with responsive desktop and mobile layouts.
- Replace the three built-in blog fallbacks and connect each existing blog entry to the normal CMS main-image field, so future Media Library replacement or removal still works.
- Use the existing website profile-image setting for the small author portrait, adding upload, preview, replace, and remove controls to Website Settings without changing the database schema.
- Keep article detail pages using the same CMS-managed article images and author information.

## Technical details
- Store the three unmodified crops as project assets and use them as fallbacks for the existing article slugs.
- Register them through the existing “Import current website content” workflow; private storage paths and signed display URLs remain unchanged.
- Save the author portrait through the existing `site_settings.profile_image_path` field and private Media Library workflow.
- Preserve all current authentication, permissions, RLS policies, and private-document boundaries.

## Verification
- Confirm all three exact crops render, all card areas/buttons navigate correctly, author/date rows display, and CMS images remain the priority.
- Check desktop and mobile layouts for cropping, readable text, overflow, broken images, and console errors.
- Inspect the preview build result after implementation.

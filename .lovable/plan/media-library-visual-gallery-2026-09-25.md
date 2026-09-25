# Media Library visual gallery

## Goal
Redesign only Admin → Media into a visual, responsive gallery while preserving the existing private storage, permissions, audit trail, and permanent-delete safeguards.

## What will change
- Replace text-first rows with responsive media cards led by a large image or playable video preview.
- Show only secondary filename and human-readable file size beneath the preview; remove usage counts and storage paths from the main card.
- Keep upload at the top and add search plus media/status filters.
- Add clear card actions for Replace, Remove from content, Archive/Restore, and the existing confirmed permanent deletion flow.
- Make uploads and replacements refresh the gallery immediately.
- Preserve archived/protected states without exposing member documents or changing any other Admin screen.

## Behavior and safeguards
- Generate short-lived signed preview URLs from the private `site-media` bucket; never store signed URLs.
- Replace the stored object safely, update its media record, preserve content references, and audit the action.
- “Remove from content” will clear active public-content references only after confirmation, without deleting the underlying media file.
- Permanent deletion remains Super Admin-only, archived-only, protected-media blocked, dependency-aware, and strongly confirmed.
- Videos will render inline with native controls and a clear play affordance; images remain visible directly in each card.

## Verification
- Check image/video uploads, visual appearance, search/filter behavior, replacement, reference removal, archive/restore, and deletion states.
- Verify mobile and desktop layouts, no horizontal overflow, no broken previews, and no console errors where authenticated access permits.
- Run the TypeScript check and inspect the preview build status.

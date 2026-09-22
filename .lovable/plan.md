# Fix the Umrah file-picker trigger

## Goal
Make every visible Umrah upload control reliably open the device’s native file picker, while preserving the existing private upload, ownership, and document-validation rules.

## Changes
- Replace the programmatic hidden-input click pattern with a native label-to-input relationship for each document category.
- Keep one permanently mounted file input per category, with a unique ID and the existing PDF/JPG/JPEG/PNG/WEBP/GIF accept list.
- Style the label as the existing upload button so pointer, touch, Enter, and Space activation work consistently across desktop and mobile browsers.
- Keep controls inactive until the signed-in member owns a saved, editable application; retain the current status and progress display.
- Preserve the existing upload handler, 10 MB validation, private `member-documents` storage, member folder paths, metadata registration, previews, Replace, and Remove behavior.

## Verification
- Use a fresh Member session and save a new Umrah application.
- Confirm all four controls are enabled and backed by four distinct mounted file inputs.
- Confirm clicking/tapping each control produces a file-chooser event at desktop and 390px mobile widths.
- Select and upload real JPG, PNG, and PDF files; confirm progress, success details, image preview/PDF indicator, Replace, and Remove.
- Confirm private ownership protections still reject cross-member access and uploads.
- Run the project’s automated checks without changing any unrelated page or module.

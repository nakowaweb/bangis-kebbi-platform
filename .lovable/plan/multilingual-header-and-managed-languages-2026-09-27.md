# Multilingual header and managed languages

## Goal
Reproduce the approved language selector within the existing BangisKebbi.com header while extending the current translation system rather than replacing it.

## What will change
- Keep English, Arabic and Hausa permanently visible in the header with flag-style markers and the same compact bordered-button arrangement shown in the reference.
- Add a “More” menu for French, Spanish, Turkish, German, Urdu and Chinese, preserving the rest of the desktop and mobile header.
- Keep English as the default, persist each visitor’s selection, retain it across navigation, and switch document direction correctly for Arabic and Urdu.
- Extend built-in interface translations and route language handling to all nine languages. Missing reviewed text will safely fall back to English rather than showing broken or invented content.
- Extend the existing dynamic-content translation workspace so Super Admin can write, generate, review, publish, unpublish and archive translations in every enabled language.
- Add a secure language-management area for Super Admin to enable/disable, order and add supported language records without weakening existing access controls.

## Responsive behavior
- Desktop and tablet show the three primary languages and “More” inline.
- Small phones keep those same four controls visible in a compact second header row; none of the primary languages are hidden.
- The dropdown follows the approved white panel, flag/name rows, spacing and restrained blue accents.

## Technical details
- Add a managed language catalogue with explicit grants and row-level policies; public visitors can read enabled rows, while only authorized translation administrators can make changes.
- Expand the existing `LanguageCode`, locale metadata, CMS translation validation and language database constraint.
- Preserve `?lang=` localized URLs, local preference storage and signed-in profile preference updates.
- Keep English source text as the fallback for unpublished or missing translations.
- Verify desktop, tablet and phone layouts, language persistence, Arabic/Urdu RTL, non-RTL languages, links, console output and the current build.

## Scope protection
No changes to the logo, navigation destinations, homepage sections, authentication, private documents, media behavior or unrelated styling.

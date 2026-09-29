# Umrah Goal Member Page — Reference-Matched Upgrade

## Goal
Rebuild only the member Umrah Goal view to closely follow the supplied navy/blue reference while preserving BangisKebbi branding, real saved balances, existing applications, documents, users, roles, and all current security boundaries.

## Member experience
- Add a compact profile/progress header with the member’s real name, permanent Member ID, real goal status, real balance, real target, and calculated progress.
- Show the green **Active** badge only when the saved Umrah goal status is `active`; use neutral treatments for other states.
- Use an existing approved Kaaba visual as a restrained branded illustration, without changing the wider site navigation.
- Recompose the payment area into matched **NGN Bank Transfer** and **USDT Transfer** cards. USDT will state **TRC20 ONLY**.
- While Live Deposits or a method is off, show locked previews only: no account number, wallet address, copy action, scannable QR, or submission button.
- When a Super Admin later configures and enables both the master switch and a method, reveal only that method’s saved details, working copy action, QR, and the existing secure receipt-submission flow.
- Build a dedicated phone composition: stacked identity/progress, readable payment cards, stable controls, and no compressed desktop layout.

## Permanent Member IDs
- Extend `profiles` with an immutable, unique `member_id` and a database sequence.
- Generate IDs in the database/server boundary, never in the browser: first three normalized letters of the member’s saved name plus a zero-padded global sequence, for example `AMI0001`.
- Backfill existing profiles deterministically without changing UUIDs; once assigned, changing a name will not change the Member ID.
- Add a guarded trigger for future profiles, uniqueness enforcement, narrow read access, and verification queries.
- Update member/admin reads to display/search by Member ID while retaining UUIDs internally for relationships and authorization.

## Super Admin controls and messaging
- Extend payment-method settings with structured NGN bank fields and USDT TRC20 wallet fields; sensitive receiving details remain hidden from members unless both switches are enabled.
- Add an optional QR payload generated from the configured enabled destination; no QR image or address is stored publicly while disabled.
- Add an Admin → Umrah action to compose and send an in-app Umrah message to members whose saved goal status is `active`.
- Reuse the existing private notification inbox and audit log. Recipient selection happens server-side, and authorization is checked server-side before sending.
- Record the message, recipient count, sender, and time in the existing audit trail without exposing UUIDs in the member interface.

## Database and deployment safety
- Update the consolidated V7 review migration non-destructively; do not execute it against the connected/live database in this task.
- Keep Live Deposits, NGN, and USDT disabled in migration defaults and postconditions.
- Preserve all existing rows and files; add only columns, sequence/trigger logic, policies, functions, and indexes required by this feature.
- Extend the read-only preflight and post-migration checks for Member ID completeness/uniqueness, disabled collection, payment-detail privacy, notification authorization, and audit logging.

## Verification and evidence
- Verify the public/signed-in member flow available in the current preview, real-data-only calculations, disabled payment states, copy/QR concealment, phone layout, links, and image loading.
- Run targeted security checks confirming members cannot alter IDs, reveal disabled receiving details, message other members, or perform admin actions.
- Capture desktop and smartphone screenshots of the implemented page and provide them for review.
- Report Admin and migration-dependent checks separately if they cannot be exercised without applying the unapproved migration or without a Super Admin session.

## Technical details
- Use existing semantic design tokens, UI controls, notification tables, audit tables, private receipt storage, and Umrah authorization helpers.
- Add a client-safe authenticated server-function module for the member goal DTO and Super Admin messaging/settings operations; do not expose raw payment settings to disabled member views.
- Keep QR generation client-side from an authorized, enabled payload only; the disabled preview uses a non-scannable icon treatment.
- No production deployment, database execution, account creation, role change, or payment activation occurs before review.

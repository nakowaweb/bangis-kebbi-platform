# Umrah payment-card refinement and Google sign-in repair

## Goal
Refine the existing premium Umrah Goal payment cards and correct the Google sign-in return flow without changing users, saved data, payment activation, or production deployment state.

## Interface changes
- Replace the NGN symbol with a clear Nigeria flag and the USDT symbol with a recognizable Tether mark.
- For each disabled method, show one clean **Coming soon** state only; remove placeholder detail rows, locked QR treatment, repeated privacy text, and duplicate unavailable messaging.
- Keep payment submission unavailable while disabled.
- Preserve the enabled state: reveal only real configured details, provide copy controls, generate a QR only from the authorized real destination, and label USDT as **TRC20 ONLY**.
- Preserve the current layout, real balances, goal calculations, member IDs, and phone-specific composition.

## Google sign-in repair
- Add a public same-origin `/auth/callback` page so OAuth never returns to a missing route.
- Store only a validated internal destination before Google sign-in; return OAuth to `/auth/callback`, wait for the authenticated session, then send admins to Admin and members to Dashboard or their original destination.
- Reuse the existing account identity and role records; do not create users or alter roles in application code.
- Keep email registration returning to Login and use the same safe destination rules for returning users.
- Keep managed Google authentication; no custom client secret or duplicate OAuth implementation.

## Production configuration review
- Record the current mismatch: authentication currently uses the Lovable preview as its Site URL and does not list `https://bangiskebbi.com/auth/callback` as an allowed return URL.
- Prepare the exact required production settings for review, but do not publish or change production authentication configuration without approval.

## Verification
- Check the disabled NGN and USDT cards on desktop and smartphone, including absence of account numbers, wallet addresses, QR codes, and submission controls.
- Verify Login starts Google with the public callback and safely preserves the intended destination.
- Verify the callback handles success, missing session, and errors without a 404.
- Run the project checks and report Google end-to-end production testing separately if it remains blocked by the unapproved production redirect setting or provider interaction.

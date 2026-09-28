# v6 / v7 revision r2 — change report (for review, NOT executed)

Nothing was run against any database. Order: backup → preflight → v6 → v7 → postcheck.

## v6 corrections
1. **member-documents storage** — old single `FOR ALL` restrictive policy let an Umrah admin's UPDATE/DELETE pass its USING clause (only the permissive v3 rule stopped it). Now split into 4 restrictive policies: read = owner or Umrah-module admin; insert/update/delete = owner folder only. Member uploads (passport, additional documents, receipts) still work because they write to `<own uid>/...`.
2. **guard_profile_active_flag** — used `current_user = 'authenticated'`, which is never true inside a SECURITY DEFINER function, so the guard never fired. Now uses `auth.uid()` + Super Admin role.
3. **Preconditions** — aborts unless `admin_permissions`, `has_role` exist and there is exactly one Super Admin.
4. **Optional tables** (`content_revisions`, `media_assets`, translations, notifications, `member_documents`, foundations, …) are skipped if absent instead of aborting.
5. **Re-run cleanup** drops only restrictive `rbac: *` policies on the listed tables (previously any `rbac:` policy anywhere).
6. **Admin permissions** — added a restrictive "no UPDATE" rule so grants can only be inserted/deleted by the Super Admin.
7. **Bucket privacy** update only touches buckets currently public (no-op on your production).

Unchanged by design: Super Admin passes every check; members keep their own applications/documents; site-media still needs v3's content-admin rule **and** a module.
**Risk to note:** users holding only `content_manager` (no `admin` role) lose CMS access under v6. Preflight P2 lists them; P3 lists admins with no module grants.

## v7 corrections (numbered as in your task)
1. **Deposits + both methods forced OFF** even when rows already exist; a final in-transaction guard rolls everything back if anything is still ON.
2. **Refund method/currency** — method is derived from the goal currency; a conflicting method is refused. New constraint `upper(method_code) = currency` covers every row.
3. **Goal forging** — guard trigger now applies to API roles only and keeps balance, owner, created_at; members may only move `not_started → active`, never `completed`. The bypass GUC is honoured only inside the owner-run functions, not for API callers.
4. **Balance changes** only in `review_umrah_transaction` / `record_umrah_refund` (SECURITY DEFINER, Umrah-admin check, audit log with balance_before). Balance can never go negative (constraint).
5. **Concurrency** — both functions lock the goal row first, then the transaction row; the status update is conditional on `pending`, so a second approval fails cleanly.
6. **Receipts** — path must be exactly `<owner uuid>/umrah-receipts/<safe name>` (no `..`); member inserts get `created_by`/`goal_id` stamped server-side; receipts cannot be overwritten or deleted by API users; Umrah admins read via signed links only.
7. **Partner contacts** stay private — defaults false, existing approvals never reset; v7 no longer re-grants partner table privileges.
8. **Existing objects inspected** — aborts if an existing finance table lacks required columns, or if approved transactions / non-zero balances already exist; `REVOKE ALL` then explicit grants on every finance table.
9. **Pre/postchecks** are NULL-safe when finance tables are absent (no errors).
10. **No live collection** is activated anywhere.

## Recovery
Both scripts are single transactions — any error leaves the database unchanged. If a problem appears after success: restore the backup, or send me the postcheck output and I'll prepare a targeted, reviewable reversal (drop the named `rbac:`/v7 policies; the new finance tables are empty and can be left in place).

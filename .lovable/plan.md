# Umrah Workflow Correction — 7 Processes

## 1. Hero buttons
- New member area at `/umrah/my` with tabs: Application, Goal, Records. It keeps the approved Umrah look.
- **Apply for Umrah** → `/umrah/my?tab=application`. Visitors land on an in-page sign-in/register step that returns them to the form afterwards. The form's draft is saved on the device, so nothing typed is lost. It reuses the existing application form: Passport required, two Additional Documents optional. The existing one-submission-per-member rule in the database stays in place. Once submitted, members see their application and its status.
- **Start My Umrah Goal** → `?tab=goal`. Members who haven't started see "Balance: 0" and "Status: Not Started", plus a "Set my goal" button.
- **Explore Travel Partners** → `/partners` (no change).

## 2. Four feature cards
Each card links to the matching tab (Partners card → `/partners`).
- **Goal dashboard:** chosen package, target amount, recorded balance, progress bar and history. Only real data is shown.
- **Packages:** Economy, Classic and VIP are created with no price and set to unavailable, until Super Admin enters real prices and descriptions. They are labelled as planning categories, not investments.
- **Records:** application, submission date, status, payments (pending, approved, rejected), refunds and receipts. Each member sees only their own; authorised admins see all.

## 3. Payment methods (built, but switched off)
- There are two methods, listed in this order: USDT, then NGN. Super Admin sets the instructions, receiving details and on/off switch for each.
- A master switch, "Live deposits", starts **OFF**. While it is off, members cannot submit payment records.
- Manual workflow: a member records a payment with a reference, and it starts as pending. An admin approves or rejects it. Only an approval adds to the balance, and that happens inside the database, once only, with a record of who did it. Balances cannot be edited directly.
- Refunds are recorded as separate entries with a record of who made them.

## 4–5. Remove old public sections
The following are removed from `/umrah`:
- The Program title and intro
- The Verified Partners block
- The old 8-step Journey
- The Important Information cards
- The Support Balance block
- The "Apply as a member" card

The new landing section, How It Works, Important Notice and contact area stay. No records are deleted.

## 6. Super Admin
Admin → Umrah gets new tabs: **Packages**, **Payment methods** (including the master switch), **Transactions** (approve, reject or refund) and **Goals** (view only). Application review, Partners and the CMS images stay as they are, with the 3-second carousel unchanged.

## 7. Testing
Playwright checks, as a visitor and as a signed-in member, on desktop and mobile:
- Every button and card
- One-time submission
- Zero-balance display
- Package selection
- Privacy: members can't read other members' rows
- A direct balance edit is rejected

The admin screens can't be tested end to end, because this database has no Super Admin account. A final report will list exactly what was tested.

## Technical details
- Migration (only adds new things, safe to re-run):
  - `umrah_packages` (tier enum economy/classic/vip, price numeric null, currency, description, is_available)
  - `umrah_goals` (user_id unique, package_id, target_amount, status not_started/active/completed, balance numeric default 0)
  - `umrah_payment_methods` (code usdt/ngn, sort_order, instructions, receiving_details, is_enabled)
  - `umrah_settings` (deposits_enabled bool default false)
  - `umrah_transactions` (user_id, goal_id, method, kind payment/refund, amount, reference, status pending/approved/rejected, reviewed_by, reviewed_at, receipt_path)
- Grants and RLS on every table: members read their own rows, admins go through `has_admin_permission(..., 'umrah')`.
- A trigger stops members from changing `balance`. The security-definer function `approve_umrah_transaction(id)` locks the row with `FOR UPDATE`, requires status = pending, credits or debits the balance once, and writes to the audit log.
- Member inserts are allowed only while `deposits_enabled` is true, the status is pending, and the row belongs to that member.
- Seed rows: the 3 packages (unavailable, no price), the 2 methods (disabled) and 1 settings row.

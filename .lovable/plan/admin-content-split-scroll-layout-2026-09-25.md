# Admin Content split-scroll layout

## What will change
- Keep the current Content search, filters, item list, and editor controls unchanged.
- On desktop, place the list and editor in a viewport-height two-column workspace.
- Give the left column its own vertical scroll area while keeping search, filters, and New item controls available at the top.
- Keep the right editor fixed within the workspace and give its long form an independent vertical scroll area.
- Preserve item selection so clicking any row continues loading it into the editor.
- On mobile, remove fixed heights and sticky behavior so the list and editor stack and scroll naturally.

## Technical details
- Update only `src/routes/_authenticated/admin.tsx` layout classes and wrappers.
- Use responsive height, overflow, and sticky utilities beginning at the desktop breakpoint.
- Keep database access, permissions, save/publish logic, colors, spacing, and content fields unchanged.
- Verify the current build state and inspect desktop and mobile layout behavior without altering authentication logic.

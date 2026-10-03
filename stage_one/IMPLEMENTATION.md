# Daymark Implementation Reference

## Project Overview

Daymark is a standalone task-planning dashboard implemented in `index.html`. The document contains the markup, styles, and application JavaScript inline. There is no framework, package manifest, server API, authentication system, database, service worker, or automated test suite in `stage_one`.

The page can be opened directly in a modern browser or hosted as a static HTML file. No build step is required.

## Current Features

- Displays the current local date and a time-of-day greeting for the sample user, Jamie.
- Shows seeded tasks on first visit, organized by due date, project, completion status, and priority.
- Filters tasks by Today, Upcoming, All tasks, and Completed, and by Work, Personal, or Ideas project.
- Searches task titles and project names as the user types.
- Adds tasks with a title, project, priority, and due date; toggles task completion; deletes individual tasks; and clears all completed tasks.
- Displays task counts, today's completion progress, a daily summary, and the next two upcoming tasks.
- Adapts its layout for smaller screens and respects reduced-motion preferences.

## Data And Behavior

Tasks are stored in browser `localStorage` under `daymark-tasks-v1`. Data is scoped to the current browser profile and origin; it is not synchronized across devices or shared with other users. On first visit or if stored JSON cannot be parsed, the page uses its five sample tasks. A valid saved array is loaded after filtering out entries that do not have a string title.

The application escapes task values before inserting them into generated HTML. The saved data is still only minimally validated, so treat browser storage as untrusted input. Storage writes are not wrapped in error handling; if browser storage is unavailable or full, updates may fail to persist.

All task actions are client-side. There is no account, backup, export/import, cross-device sync, confirmation before clearing completed tasks, or server-side validation. The sample name and project/task seed data are embedded in the HTML and are not user profiles.

## External Assets

The page loads DM Sans and Manrope from Google Fonts, Lucide icons from `unpkg.com`, and a background photo from Unsplash. These resources require network access and may be blocked by a network policy or content blocker. Core task state and interactions are implemented locally, but missing Lucide will leave icon placeholders and missing Unsplash access will remove the photo.

There are no local build or runtime dependencies to install. Keep external assets non-sensitive and avoid adding credentials to this static page; anything embedded in HTML or browser JavaScript is public to visitors.

## Manual Verification

1. Open `index.html` in a current desktop or mobile browser.
2. Add a task with each project/priority option; verify it appears in All tasks and the matching project filter.
3. Search by task title and project, then test Today, Upcoming, and Completed filters.
4. Mark a task complete, reload, and verify it remains saved; delete a task and test Clear completed.
5. Resize to a narrow viewport and check the bottom navigation and task form remain usable.
6. Test with external network access disabled to confirm the layout and local interactions still work without fonts, remote icons, and the photo.
7. Inspect browser storage for `daymark-tasks-v1`; clear that key to restore the sample tasks.

There is no npm test, lint, typecheck, or build command for this project. Test changes manually in a browser; if a static server is used, run it from the `stage_one` directory and test the hosted origin because browser storage is origin-specific.

## PWA Status

No manifest or service worker is present in `stage_one`. The PWA implementation documented in `stage_two/shop/PWA_IMPLEMENTATION.md` applies only to the separate Next.js shop project and does not affect this standalone dashboard.
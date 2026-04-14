# Changelog

All notable changes for **Questarr More** are documented in this file. Version numbers follow the build from `package.json`.

## [2.0.0] — 2026-04-14

### Branding & docs

- Product name in the UI: **Questarr More**; release **v2.0.0**.
- README overhaul: clearer mission, feature list, and what this fork adds vs upstream Questarr.
- Central UI branding in `client/src/lib/app-branding.ts` (easy to adjust for your fork).

### Downloads & integrations

- **SABnzbd / NZBGet**: more reliable NZB hand-off (e.g. prefetch + form field compatibility for SAB).
- Reduced polling load when syncing downloader queues.

### Library automation

- **Auto-import** (Settings → Folders): after downloads complete, match and move/rename from a source folder into `<LibraryRoot>/<Console>/<GameTitle>/` (optional rename rules).

### Request workflow (formerly wishlist UX)

- **Request** page: streamlined actions — confirm opens download flow, remove deletes the entry; hide/unhide removed from cards where applicable.
- Cards: cover-first layout, console/status badges, hover/detail overlay, violet request accent.

### Discover & dashboard

- Discover: default platform **“Alle”**, carousels with loop, **all games** as vertical grid.
- Dashboard: refined “Recent requests” and trending sections; tighter carousel spacing.

### UI / UX

- **Light mode** fixes: `color-scheme`, body gradients, glass surfaces, theme-aware cards and details modal.
- **Mobile**: responsive header (search below title), downloads & settings layouts, touch targets, `dvh` shell, safe-area padding on body.
- Global search and sidebar polish.

### Technical

- SQLite + migrations for new settings (e.g. auto-import).
- Vitest config for mixed Node/UI tests where applicable.

---

## Earlier history

This project builds on **[Questarr](https://github.com/Doezer/Questarr)**. For upstream changes prior to the Questarr More fork line, see the original repository history and releases.

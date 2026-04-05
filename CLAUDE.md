# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file HTML dashboard (`index.html`) for sales call tracking. No build step, no dependencies, no backend. Open directly in a browser. All data persists via `localStorage`.

## Architecture

Everything lives in `index.html` in three blocks:

1. **`<style>`** — CSS custom properties drive the entire design. The color palette is defined in `:root` vars (`--accent: #ff6600`, `--bg`, `--surface`, etc.). Modify vars there first before touching individual rules.

2. **`<body>`** — Three main tabs (`tab-daily`, `tab-weekly`, `tab-monthly`). The weekly tab contains three sub-tabs (`sub-review`, `sub-calls`, `sub-plan`) switched by `switchSubTab()`. All tab switching is CSS `display` toggling via `.active` classes.

3. **`<script>`** — Vanilla JS, no frameworks. Key patterns:
   - All data reads/writes go through `localStorage` with structured keys:
     - `daily_YYYY-MM-DD` — per-day entries
     - `week_YYYY-MM-DD` — weekly entries (keyed by week start date)
     - `month_YYYY-MM` — monthly entries
     - `patternLog` — array of after-dial entries (max 90)
     - `objectionBank` — array of objection objects `{id, objection, response, date}`
     - `customSkills` — array of user-saved skill chip strings
   - `loadDailyEntry()` / `saveAfter()` / `saveBefore()` are the core daily functions
   - `loadWeeklyEntry()` calls `renderWeekDailySummary()` which auto-pulls daily entries for the selected week and calculates outcome totals and skill rating averages
   - `renderObjectionBank()` writes to both `#objectionBank` (weekly) and `#objectionBankMonthly` simultaneously
   - `currentWeekOffset` and `currentMonthOffset` are integers relative to the current week/month; `getWeekKey(offset)` and `getMonthKey(offset)` derive localStorage keys from them

## Key Behaviours to Preserve

- **Cmd+S** saves context-aware: detects active tab and calls the right save function
- **Week strip** (daily tab) shows Mon–Sun dots, glowing orange for days with entries, clickable to jump to that date
- **Accountability banner** on Weekly > Review auto-pulls `nextSkill` from the *previous* week's localStorage entry
- **Blocked field** (`#blockedField`) is hidden by default and shown only when skill rating is 1 or 2 via `updateBlockedVisibility()`
- **Export** dumps all localStorage keys to a `.json` file; **Import** reads it back and reloads the page
- Outcome totals (connects/demos/callbacks) on the weekly summary are calculated live from daily entries, not stored separately

## Git & GitHub

**Commit and push after every meaningful change.** This is non-negotiable — the user relies on GitHub as the source of truth and recovery point for all work. Do not batch up multiple features before committing.

- Push to `https://github.com/haizen2180/salesdash`, directly to `main`, after every task
- Write descriptive commit messages that explain *what changed and why*, not just "update index.html"
- If a session involves multiple distinct changes (e.g. a design fix + a new feature), commit them separately with individual messages
- Never leave a session without the latest state pushed to GitHub

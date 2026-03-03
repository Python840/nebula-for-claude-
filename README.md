# Nebula for Claude

A deep-space ambient atmosphere for [claude.ai](https://claude.ai) — animated starfield backgrounds, glassmorphism panels, and focus tools. Built for the aesthetic, zero bloat.

![Nebula for Claude screenshot](screenshot.png)

---

## Features

- **Animated nebula background** — slow-drifting gradient layers, no external images
- **Star field** — 480 deterministic stars (stable across reloads, no flickering)
- **Glassmorphism panels** — sidebar, header, input, modals all go frosted-glass
- **4 themes** — Void (cyan), Nebula (purple), Neon (vivid cyan), Mono (slate)
- **Focus mode** — hides conversation history until you hover the sidebar
- **Glow accents** — subtle neon glow on interactive elements
- **Grid lines** — optional HUD overlay
- **Panel opacity + blur sliders** — dial in exactly how much you want
- **Animation speed** — Slow / Medium / Off
- **SPA-aware** — survives Next.js navigation without breaking
- **Private** — no network calls, no analytics; settings sync via `chrome.storage.sync`

---

## Install (unpacked)

1. [Download or clone](https://github.com/your-username/nebula-for-claude) this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `nebula-for-claude` folder
5. Pin the extension from the puzzle icon
6. Open [claude.ai](https://claude.ai) and enjoy

Chrome Web Store release planned.

---

## Themes

| Name   | Base       | Accent       | Vibe                        |
|--------|------------|--------------|-----------------------------|
| Void   | `#020817`  | cyan         | Deep space, Nano City       |
| Nebula | `#05020f`  | purple       | Galactic, atmospheric       |
| Neon   | `#010a10`  | vivid cyan   | Electric, high-contrast     |
| Mono   | `#0a0a0f`  | indigo       | Minimal, clean              |

---

## Permissions

```json
"permissions": ["storage"],
"host_permissions": ["https://claude.ai/*"]
```

- **storage** — remembers your settings across sessions
- **host_permissions** — runs only on claude.ai

No data leaves your machine.

---

## How it works

- Injects a fixed `<div id="nebula-bg">` behind claude.ai's `#__next` container
- Adds CSS classes to `<html>` to trigger glassmorphism on structural elements
- Star field is generated via a deterministic LCG sequence (seeded, not random) — same stars every load
- Patches `history.pushState` / `replaceState` to survive SPA navigation
- All settings stored in `chrome.storage.sync` — syncs across devices

---

## License

MIT — do anything, keep the notice.

---

*Maintained with Claude.*

# Toolkit

A personal Chrome extension I built for myself with a bunch of small quality-of-life features I wanted in my browser. Open-sourcing it in case any of these are useful to you too.

It's a grab-bag, not a polished product — each feature is a standalone content script. Feel free to fork it and keep only the parts you want (just trim [manifest.json](manifest.json) accordingly).

## Install

1. Clone or download this repo.
2. Visit `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and pick this folder.

## Features

### Custom New Tab Page
A minimal new-tab page ([newtab.html](features/new-tab/ui/newtab.html)) with:
- A search box that supports multiple engines (Google, Perplexity, ChatGPT, Claude, Gemini, YouTube, Google AI Mode, Grok, Amazon, Google Maps, Reddit).
- Type a short alias prefix (e.g. `ppx ` for Perplexity, `gpt ` for ChatGPT, `amz ` for Amazon) to route the query to a specific engine.
- Inline bookmark search — start typing and matching bookmarks show up below the search box.
- One-click "Close Other Tabs" and "Manage Extensions" buttons.
- A friendly greeting at the top.

### Domain Blocker
Block time-wasting domains with a built-in cool-down. Toggle on/off and manage the list from the extension popup ([popup.html](popup.html)). When you hit a blocked domain it shows a countdown overlay before letting you through (configurable in [domain-blocker.js](features/domain-blocker/domain-blocker.js)).

### "Close Other Tabs" Shortcut + Context Menu
- Right-click anywhere → **Close Other Tabs** (keeps the current tab and any pinned tabs).
- Keyboard shortcut: `Cmd/Ctrl + Shift + Y`.

Configured in [custom-context-menu-actions.js](features/close-other-tabs/custom-context-menu-actions.js).


### Text Selection Popup on X (Twitter)
[text-selection-popup.js](features/x-text-selection/text-selection-popup.js) — select text in any editable field on x.com and a small popup appears with shortcuts to send the selection to Claude/ChatGPT for rewriting or refining.

### YouTube Tweaks

- **Player Watch Later button** ([youtube-player-buttons.js](features/youtube/youtube-player-buttons.js)) — adds a Watch Later button directly to the video player controls.
- **Auto-press `t` on watch pages** ([youtube-watch-t-keypress.js](features/youtube/youtube-watch-t-keypress.js)) — toggles theater mode automatically when a video loads.
- **Playlist quick-add buttons** ([youtube-playlist-buttons.js](features/youtube/youtube-playlist-buttons.js)) — quick add/remove from Watch Later on playlist pages.
- **Homepage "Watch Later on title click"** ([youtube-homepage-watch-later.js](features/youtube/youtube-homepage-watch-later.js)) — adds videos to Watch Later when you click on the video title in homepage.
- **YouTube Music playlist filtering** ([yt-music-playlist-filtering.js](features/youtube/yt-music-playlist-filtering.js)) — hides specific playlists I don't want cluttering my library (edit the `PLAYLISTS_TO_HIDE` list to customize).

## Notes

This is a personal toolkit, so it's wired together for my workflow and styling. Pick what you like, drop what you don't. I'll keep building this around what I personally need.

## License

[MIT](LICENSE)

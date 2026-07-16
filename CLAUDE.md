# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Trace Selector is a single-page, no-build, vanilla JS/HTML/CSS tool. It generates `TlfSetVariable` shell commands used to configure debug trace levels for the modules of a set-top-box (STB) software stack (DatahubManager, ConfigManager, NetworkManager, TomiPlayer, Ocdm*, RestManager, etc.).

There is no package.json, build step, bundler, or test suite — this is 4 files total:

- `index.html` — page shell: sidebar (module list + search + generated command box) and main area (per-module trace level table). Contains a `<template id="row-template">` cloned per trace position row.
- `script.js` — all app logic, plain DOM APIs, no framework, no imports.
- `styles.css` — all styling, theme via CSS custom properties + `[data-theme="dark"]` override, persisted to `localStorage`.
- `config.json` — data-only: `traceLevels` (hex digit → label) and `modules[]` (each with `name`, `positions[]`, `default` hex string).

## Running / testing

No build tooling exists. Serve the directory statically and open in a browser, e.g.:

```bash
python3 -m http.server 8000
```

`script.js` fetches `config.json` via `fetch()`, so opening `index.html` directly as a `file://` URL will fail (CORS) — always serve over HTTP.

There is no linter or test runner configured; verify changes by loading the page and exercising the module list, search box, radio buttons, theme toggle, and copy button.

## Architecture / data flow

Everything is driven by `config.json`, loaded once on `DOMContentLoaded`:

1. `loadConfig()` fetches and parses `config.json`, then calls `renderModuleList()` and `updateModule(0)`.
2. `renderModuleList()` sorts `config.modules` alphabetically by `name` and renders the sidebar `<li>` list; clicking an item calls `updateModule(index)`.
3. `updateModule(pos)` sets the module title, calls `renderLevels(module)` to rebuild the table body from `row-template`, and `updateCommand(module)` to regenerate the command text.
4. Each module's `positions[]` array maps 1:1 to hex digits in its `default` string, read **right-to-left** — position `positions[0]` corresponds to the *last* hex digit. `parseDefaultString()` pads/reverses the hex string to align it with the positions array. A position value of `"N/A"` is skipped entirely (no radio row rendered) — see `SystemManager` in `config.json` for an example.
5. Radio buttons per row have values `1` (Error), `3` (Warning), `7` (Info), `F` (Debug), `0` (Disabled) — matching `traceLevels` in `config.json`. Changing any radio (delegated `change` listener on the `<tbody>`) re-triggers `updateCommand()`.
6. `updateCommand(module)` walks `positions.length` downward, reads the checked radio for each index, and concatenates hex digits (uppercased) into one value, producing `TlfSetVariable Debug/Debug<ModuleName> 0x<hex>`.
   - Two modules are special-cased by name: `"App BoB"` and `"App Latam"` emit multi-line, non-hex commands instead (toggling debug on/off via named variables) rather than the generic hex format.

## Adding a new module

Add an entry to `config.modules` in `config.json` with `name`, `positions` (ordered list of trace point labels, or `"N/A"` to skip a digit), and `default` (hex string, same length as non-skipped digit count, read right-to-left against `positions`). No code changes are needed unless the module needs special-cased command output like `App BoB`/`App Latam`.

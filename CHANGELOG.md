# Changelog

## 1.1.0 — 2026-02-07

### Fixed
- **Critical**: Removed CSP restoration functions that could strip Cursor's native `unsafe-inline` from `style-src`, breaking editor styling on disable
- **Critical**: Switched from external `<link>` CSS injection to inline `<style>` injection — external CSS files silently fail to load in Cursor's Electron sandbox
- Fixed status bar gradient animation not playing (`background` shorthand was resetting `background-size`)
- Fixed starfield not rendering on `body`/`.monaco-workbench` pseudo-elements — moved to `html::before/::after`
- Fixed glassmorphism not visible due to inner children having opaque backgrounds
- Narrowed `*:focus-visible` to `.monaco-workbench *:focus-visible` to avoid interfering with native focus styles

### Added
- Auto-cleanup: effects are automatically removed when switching away from an effects theme
- Light theme: added missing `.token.regexp` glow, minimap glow, and editor group border glow (feature parity with dark theme)
- Atomic file writes to prevent workbench.html corruption on crash
- GPU optimization: `will-change: transform, opacity` on starfield pseudo-elements

### Changed
- Increased starfield density from 16 to ~390 dots using CSS tiling trick (2x2 and 3x3 background-repeat)
- Increased dot sizes (3.5-5px) and opacity for better visibility
- Glassmorphism opacity set to 50% on command palette and suggest widget
- `disableEffects` now accepts silent mode for auto-cleanup scenarios
- Removed redundant `effectsApplied` boolean from globalState (version number is sufficient)

## 1.0.0 — 2026-02-07

### Added
- **Candy Pop** (dark) theme with neon glow effects, sparkle particles, animated gradient status bar, and glassmorphism
- **Light Candy Pop** (light) theme with soft glow effects, sparkle particles, and glassmorphism
- **Candy Pop Clean** (dark) theme — same colors, no effects
- **Light Candy Pop Clean** (light) theme — same colors, no effects
- Commands: `Candy Pop: Enable Glow & Effects` and `Candy Pop: Disable Glow & Effects`
- Auto-detection: effects are applied automatically when Candy Pop or Light Candy Pop themes are selected
- Typing sparkle burst particles at cursor position
- Floating background starfield sparkles
- Neon text-shadow glow on syntax tokens (keywords, functions, strings, types)
- Cursor glow with pulse animation
- Selection glow halo
- Glowing bracket pairs
- Glassmorphism on sidebar, panels, suggest widget, and command palette
- Animated gradient status bar
- Activity bar icon glow
- Button and badge glow effects
- Full ANSI terminal color palette for both themes
- Semantic token highlighting for TypeScript/JavaScript
- Comprehensive workbench color customization (~80 color keys per theme)
- ~40 TextMate token color scopes per theme

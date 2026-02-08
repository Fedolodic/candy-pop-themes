# Screenshot Guide for Candy Pop Themes

How to capture marketplace-quality screenshots for the Candy Pop Themes extension listing.

## Environment Setup

### Window & Display

- **Resolution**: 1920x1080 minimum (set your VS Code window to full screen at this resolution)
- **Scaling**: 100% display scaling for pixel-perfect captures
- **Window chrome**: Hide the OS title bar if possible (VS Code setting: `"window.titleBarStyle": "custom"`)

### Font

- **Primary**: JetBrains Mono (download from https://www.jetbrains.com/lp/mono/)
- **Alternative**: Fira Code
- **Size**: 14-16px (`"editor.fontSize": 14` or `16`)
- **Ligatures**: Enable them (`"editor.fontLigatures": true`) -- they look great in screenshots

### VS Code Settings for Screenshots

Add these to your `settings.json` temporarily while taking screenshots:

```jsonc
{
  "editor.fontSize": 15,
  "editor.fontFamily": "JetBrains Mono, Fira Code, monospace",
  "editor.fontLigatures": true,
  "editor.minimap.enabled": true,
  "editor.minimap.renderCharacters": true,
  "breadcrumbs.enabled": true,
  "workbench.statusBar.visible": true,
  "workbench.activityBar.location": "side"
}
```

## UI Elements to Show

Make sure all of these are visible in each screenshot:

- **Activity bar** (left icon strip) -- visible and showing the Explorer icon active
- **Sidebar / File Explorer** -- open, showing the showcase files and project structure
- **Editor tabs** -- have 2-3 files open (see arrangement below)
- **Breadcrumbs** -- enabled and visible above the editor
- **Minimap** -- enabled on the right side of the editor
- **Status bar** -- visible at the bottom (shows the animated gradient on effect themes)
- **Terminal panel** -- open at the bottom with some colorful output

## Editor Arrangement

### Active File

Open `showcase/theme-demo.ts` as the main file in the editor. This file is designed to show off syntax highlighting across many token types.

### Secondary Tabs

Have these files open as background tabs (click them first to load, then switch back to `theme-demo.ts`):

1. `showcase/index.html`
2. `showcase/config.json`

The tab bar should show all three files with `theme-demo.ts` as the active tab.

### Terminal

Open the integrated terminal panel at the bottom of the window (`Ctrl+`` `). Run a command that produces colorful output, for example:

```bash
npm test
```

Or simply type a few lines to show the terminal prompt with colors. The terminal should take up roughly 20-25% of the editor height.

### File Explorer

Expand the file tree in the sidebar to show the project structure. Make sure the `showcase/` folder is expanded so the demo files are visible.

## Screenshots to Capture

Take one screenshot per variant. Save each to the `screenshots/` directory at the project root.

| Variant | Filename | Theme to Activate |
|---------|----------|-------------------|
| Dark with effects | `candy-pop-dark.png` | Candy Pop |
| Light with effects | `candy-pop-light.png` | Light Candy Pop |
| Dark clean (no effects) | `candy-pop-clean.png` | Candy Pop Clean |

### Steps for Each Variant

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Select **Preferences: Color Theme**
3. Choose the variant you want to screenshot
4. If switching to/from an effects theme, reload the window when prompted
5. Wait a moment for effects (glow, sparkles) to fully render
6. Capture the screenshot
7. Save it to `screenshots/` with the correct filename

## Recommended Screenshot Tools

- **Windows Snipping Tool** (`Win+Shift+S`) -- best for full-window captures
- **CodeSnap extension** -- useful for code-only shots (cropped editor area), good for social media
- **ShareX** -- advanced option with auto-save, annotations, and more

## Image Guidelines

- **Format**: PNG (lossless, no compression artifacts)
- **Dimensions**: Match your VS Code window size (1920x1080 recommended)
- **No personal data**: Make sure no personal file paths, usernames, or sensitive info are visible in the file explorer or terminal
- **Clean state**: Close any notification toasts or popups before capturing

## After Taking Screenshots

1. Verify the images look good at both full size and thumbnail size (marketplace listing shows small previews)
2. Make sure files are saved to `screenshots/` with the exact names listed above
3. Run `npm run package` to rebuild the extension VSIX with the updated screenshots
4. Re-upload to the marketplace if already published

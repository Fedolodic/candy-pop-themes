# Candy Pop Themes

Vibrant pink, purple, and cyan themes for VS Code and Cursor, now with a guided delight journey, effect intensity profiles, and reduced-motion-aware behavior.

![Candy Pop Dark](./screenshots/dark.png)
![Candy Pop Light](./screenshots/light.png)

## Why This Theme Feels Different

Candy Pop focuses on emotional flow across the full customer journey:
- Discover: bold visual identity out of the box.
- Personalize: pick your intensity profile in seconds.
- Settle in: calm motion when needed.
- Trust: run a health check when something feels off.

## Themes

| Theme | Style | Effects |
|-------|-------|---------|
| **Candy Pop** | Dark | Glow, sparkles, glassmorphism, animated status bar |
| **Light Candy Pop** | Light | Glow, sparkles, glassmorphism, animated status bar |
| **Candy Pop Clean** | Dark | Colors only, no effects |
| **Light Candy Pop Clean** | Light | Colors only, no effects |

## 60-Second Quick Start

1. Install the extension (a guided-tour prompt appears on first install by default).
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run `Candy Pop: Start Guided Tour` (or `Candy Pop: Start Delight Journey` for direct setup).
4. Choose your theme and effect profile.
5. Reload when prompted.

## Commands

| Command | Purpose |
|---------|---------|
| `Candy Pop: Start Guided Tour` | Interactive tour of themes, commands, settings, and docs |
| `Candy Pop: Start Delight Journey` | Guided setup (theme + profile + motion comfort) |
| `Candy Pop: Choose Effect Profile` | Switch intensity profile anytime |
| `Candy Pop: Enable Glow & Effects` | Manually apply effects |
| `Candy Pop: Disable Glow & Effects` | Remove injected effects |
| `Candy Pop: Run Health Check` | View diagnostics in output panel |

## Effect Profiles

| Profile | Experience |
|---------|------------|
| `immersive` | Full sparkle and glow energy |
| `balanced` | Moderated effect intensity for daily use |
| `gentle` | Sparkles off and softer emphasis |
| `minimal` | Near-clean feel with minimal extras |

## Settings

Use Settings UI or `settings.json`:

```json
{
  "candyPop.effectProfile": "immersive",
  "candyPop.autoEnableEffects": true,
  "candyPop.showWelcomeOnFirstUse": true,
  "candyPop.showGuidedTourOnUpdate": true,
  "candyPop.respectReducedMotion": true
}
```

Setting details:
- `candyPop.effectProfile`: chooses effect intensity.
- `candyPop.autoEnableEffects`: auto-apply effects for Candy Pop effect themes.
- `candyPop.showWelcomeOnFirstUse`: show one-time setup prompt.
- `candyPop.showGuidedTourOnUpdate`: show a guided tour prompt after extension updates.
- `candyPop.respectReducedMotion`: calm key animations when `workbench.reduceMotion` is enabled.

## Onboarding and Guided Tour

- First install: Candy Pop prompts you to start a guided tour by default.
- After updates: Candy Pop prompts you to review features again by default.
- Theme switch fallback: if you jump straight to an effects theme, you still get a setup prompt.
- You can always restart onboarding manually with `Candy Pop: Start Guided Tour`.
- You can disable onboarding prompts with `candyPop.showWelcomeOnFirstUse` and `candyPop.showGuidedTourOnUpdate`.

## Features

### Neon Glow Effects
- Breathing cursor glow with pulse animation
- Syntax token glow on keywords, functions, strings, types, decorators, and more
- Glowing bracket pairs with per-depth colors
- Selection halo glow
- Active tab and button glow

### Floating Sparkle Starfield
- ~390 CSS-only sparkle dots across two layers (pink/magenta + cyan/violet)
- Gentle drift and twinkle animations
- GPU-accelerated with `will-change` hints

### Glassmorphism
- Frosted glass effect on sidebar, bottom panel, command palette, and autocomplete
- Semi-transparent backgrounds with backdrop blur

### Animated Status Bar
- Smooth gradient shift animation across the status bar
- Dark theme: deep purple gradient
- Light theme: soft pink gradient

### Additional Effects
- Activity bar icon glow on active/hover
- Badge glow on notification badges
- Scrollbar glow on hover
- Minimap decoration glow
- Editor group border glow
- Focus ring glow

## Installation

### From the Marketplace
1. Open **Extensions** sidebar (`Ctrl+Shift+X` / `Cmd+Shift+X` on macOS)
2. Search for **Candy Pop Themes**
3. Click **Install**
4. Open Command Palette and run `Preferences: Color Theme`
5. Choose **Candy Pop**, **Light Candy Pop**, **Candy Pop Clean**, or **Light Candy Pop Clean**

### Build and Package From Source
```bash
npm ci
npm run package
```

This generates a versioned VSIX in the project root:
- `candy-pop-themes-<version>.vsix`

### From VSIX
```bash
code --install-extension "$(ls -1t candy-pop-themes-*.vsix | head -n1)"
# or for Cursor:
cursor --install-extension "$(ls -1t candy-pop-themes-*.vsix | head -n1)"
```

## Enabling and Disabling Effects

Effects are automatically enabled for `Candy Pop` and `Light Candy Pop` when `candyPop.autoEnableEffects` is true.

Manual controls:
- `Candy Pop: Enable Glow & Effects`
- `Candy Pop: Disable Glow & Effects`

Notes:
- Effects modify the workbench HTML file.
- On Windows, Administrator permissions may be required.
- Reload is required after enabling/disabling effects.
- Clean variants do not use injection.

## Health Check and Troubleshooting

Run `Candy Pop: Run Health Check` to print diagnostics in the **Candy Pop** output panel:
- Active theme
- Effect profile
- Reduced-motion behavior
- Workbench HTML target path

Known issues:
- After editor updates, injection can be overwritten. Re-run enable effects or switch themes.
- The "Corrupted Installation" warning is expected after injection and can be dismissed.

## Screenshots

![Candy Pop Dark Theme](./screenshots/dark.png)
*Candy Pop (Dark) - Full effects*

![Light Candy Pop Theme](./screenshots/light.png)
*Light Candy Pop - Full effects*

## Requirements

- VS Code 1.80+ or Cursor
- Administrator access on Windows for effects injection

## Contributing

Contributions are welcome. Open an issue or PR.

Development commands:
```bash
npm ci
npm run build
npm run watch
npm run package
```

## License

[MIT](LICENSE)

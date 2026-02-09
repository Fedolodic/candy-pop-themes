import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const CANDY_THEMES = ['Candy Pop', 'Light Candy Pop'];

// Bump this to force re-injection when CSS files change
const EFFECTS_VERSION = 12;

// HTML comment markers for the inline <style> injection
const STYLE_MARKER_START = '<!-- CANDY_POP_EFFECTS_START -->';
const STYLE_MARKER_END = '<!-- CANDY_POP_EFFECTS_END -->';

// Legacy filename that was copied to workbench directory (for cleanup)
const LEGACY_CSS_DEST_FILENAME = 'candy-pop-effects.css';

// Legacy markers to clean up from previous versions
const OLD_CSS_MARKER_START = '/* >>> CANDY POP THEME EFFECTS START <<< */';
const OLD_CSS_MARKER_END = '/* >>> CANDY POP THEME EFFECTS END <<< */';
const OLD_JS_MARKER_START_V1 = '/* >>> CANDY POP PARTICLES START <<< */';
const OLD_JS_MARKER_END_V1 = '/* >>> CANDY POP PARTICLES END <<< */';
const OLD_JS_MARKER_START_V2 = '<!-- CANDY_POP_PARTICLES_START -->';
const OLD_JS_MARKER_END_V2 = '<!-- CANDY_POP_PARTICLES_END -->';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('candyPop.enableEffects', () => {
      enableEffects(context, false);
    }),
    vscode.commands.registerCommand('candyPop.disableEffects', () => {
      disableEffects(context);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('workbench.colorTheme')) {
        onThemeChanged(context);
      }
    })
  );

  onThemeChanged(context);
}

export function deactivate() {}

function getActiveThemeName(): string {
  return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme') || '';
}

function isCandyEffectTheme(themeName: string): boolean {
  return CANDY_THEMES.some(t => themeName === t);
}

function onThemeChanged(context: vscode.ExtensionContext) {
  const theme = getActiveThemeName();

  if (isCandyEffectTheme(theme)) {
    const appliedVersion = context.globalState.get<number>('effectsVersion', 0);
    const appliedTheme = context.globalState.get<string>('appliedTheme', '');
    // Re-inject if version bumped OR theme variant changed (dark <-> light)
    if (appliedVersion < EFFECTS_VERSION || appliedTheme !== theme) {
      enableEffects(context, true);
    }
  } else {
    // Auto-remove effects when switching away from an effects theme
    const appliedVersion = context.globalState.get<number>('effectsVersion', 0);
    if (appliedVersion > 0) {
      disableEffects(context, true);
    }
  }
}

async function enableEffects(context: vscode.ExtensionContext, silent: boolean) {
  try {
    const themeName = getActiveThemeName();
    const isDark = !themeName.includes('Light');

    const cssFileName = isDark ? 'candy-pop-glow.css' : 'light-candy-pop-glow.css';
    const cssSrcPath = path.join(context.extensionPath, 'css', cssFileName);

    if (!fs.existsSync(cssSrcPath)) {
      vscode.window.showErrorMessage(`Candy Pop: CSS file not found: ${cssSrcPath}`);
      return;
    }

    const workbenchPath = getWorkbenchHtmlPath();
    if (!workbenchPath) {
      vscode.window.showErrorMessage(
        'Candy Pop: Could not locate workbench file. Effects cannot be applied.'
      );
      return;
    }

    // Read the CSS content to inject inline
    const cssContent = fs.readFileSync(cssSrcPath, 'utf8');

    let html = fs.readFileSync(workbenchPath, 'utf8');

    // Remove all legacy injections from previous versions
    html = removeInjection(html, OLD_CSS_MARKER_START, OLD_CSS_MARKER_END);
    html = removeInjection(html, OLD_JS_MARKER_START_V1, OLD_JS_MARKER_END_V1);
    html = removeInjection(html, OLD_JS_MARKER_START_V2, OLD_JS_MARKER_END_V2);
    html = removeInjection(html, STYLE_MARKER_START, STYLE_MARKER_END);

    // Remove any leftover inline test markers from debugging
    html = removeInjection(html, '<!-- CANDY_POP_INLINE_TEST -->', '<!-- /CANDY_POP_INLINE_TEST -->');

    // Clean up legacy CSS file from workbench directory if it exists
    const workbenchDir = path.dirname(workbenchPath);
    const legacyCssPath = path.join(workbenchDir, LEGACY_CSS_DEST_FILENAME);
    if (fs.existsSync(legacyCssPath)) {
      fs.unlinkSync(legacyCssPath);
    }

    // Inject CSS as inline <style> block before </head>
    // External <link> files don't load in Cursor's Electron, but inline <style> does
    const styleInjection = [
      STYLE_MARKER_START,
      `<style>${cssContent}</style>`,
      STYLE_MARKER_END,
    ].join('\n');
    html = html.replace('</head>', `${styleInjection}\n</head>`);

    atomicWriteFileSync(workbenchPath, html);
    await context.globalState.update('effectsVersion', EFFECTS_VERSION);
    await context.globalState.update('appliedTheme', themeName);

    if (!silent) {
      const action = await vscode.window.showInformationMessage(
        'Candy Pop: Effects enabled! Reload to see changes.',
        'Reload Now'
      );
      if (action === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } else {
      const action = await vscode.window.showInformationMessage(
        'Candy Pop: Updated effects ready. Reload to activate.',
        'Reload Now',
        'Dismiss'
      );
      if (action === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  } catch (err: any) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      vscode.window.showErrorMessage(
        'Candy Pop: Permission denied. Run your IDE as Administrator to enable effects.'
      );
    } else {
      vscode.window.showErrorMessage(`Candy Pop: Failed to enable effects — ${err.message}`);
    }
  }
}

async function disableEffects(context: vscode.ExtensionContext, silent: boolean = false) {
  try {
    const workbenchPath = getWorkbenchHtmlPath();
    if (!workbenchPath) {
      if (!silent) {
        vscode.window.showErrorMessage('Candy Pop: Could not locate workbench file.');
      }
      return;
    }

    let html = fs.readFileSync(workbenchPath, 'utf8');

    // Remove all injections (legacy and current)
    html = removeInjection(html, OLD_CSS_MARKER_START, OLD_CSS_MARKER_END);
    html = removeInjection(html, OLD_JS_MARKER_START_V1, OLD_JS_MARKER_END_V1);
    html = removeInjection(html, OLD_JS_MARKER_START_V2, OLD_JS_MARKER_END_V2);
    html = removeInjection(html, STYLE_MARKER_START, STYLE_MARKER_END);

    // Remove any leftover inline test markers from debugging
    html = removeInjection(html, '<!-- CANDY_POP_INLINE_TEST -->', '<!-- /CANDY_POP_INLINE_TEST -->');

    atomicWriteFileSync(workbenchPath, html);

    // Clean up legacy CSS file from workbench directory if it exists
    const workbenchDir = path.dirname(workbenchPath);
    const legacyCssPath = path.join(workbenchDir, LEGACY_CSS_DEST_FILENAME);
    if (fs.existsSync(legacyCssPath)) {
      fs.unlinkSync(legacyCssPath);
    }

    await context.globalState.update('effectsVersion', 0);
    await context.globalState.update('appliedTheme', '');

    if (!silent) {
      const action = await vscode.window.showInformationMessage(
        'Candy Pop: Effects disabled. Reload to apply.',
        'Reload Now'
      );
      if (action === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  } catch (err: any) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      vscode.window.showErrorMessage(
        'Candy Pop: Permission denied. Run your IDE as Administrator.'
      );
    } else {
      vscode.window.showErrorMessage(`Candy Pop: Failed to disable effects — ${err.message}`);
    }
  }
}

function atomicWriteFileSync(filePath: string, content: string) {
  const tmpPath = filePath + '.candy-tmp';
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function removeInjection(html: string, startMarker: string, endMarker: string): string {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1) {
    let end = endIdx + endMarker.length;
    while (end < html.length && (html[end] === '\n' || html[end] === '\r')) {
      end++;
    }
    return html.substring(0, startIdx) + html.substring(end);
  }
  return html;
}

function getWorkbenchHtmlPath(): string | null {
  const appRoot = vscode.env.appRoot;

  // Directory candidates (newest first)
  const dirCandidates = [
    path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-browser'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox'),
    path.join(appRoot, 'out', 'vs', 'workbench'),
  ];

  // Filename candidates (includes Cursor via workbench-apc-extension.html)
  const fileCandidates = [
    'workbench.html',
    'workbench.esm.html',
    'workbench-dev.html',
    'workbench-dev.esm.html',
    'workbench-apc-extension.html',
    'workbench.desktop.main.html',
  ];

  for (const dir of dirCandidates) {
    for (const file of fileCandidates) {
      const p = path.join(dir, file);
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const CANDY_THEMES = ['Candy Pop', 'Light Candy Pop'] as const;
const ALL_CANDY_THEMES = ['Candy Pop', 'Light Candy Pop', 'Candy Pop Clean', 'Light Candy Pop Clean'] as const;

// Bump this to force re-injection when CSS or runtime overrides change.
const EFFECTS_VERSION = 13;

// HTML comment markers for the inline <style> injection.
const STYLE_MARKER_START = '<!-- CANDY_POP_EFFECTS_START -->';
const STYLE_MARKER_END = '<!-- CANDY_POP_EFFECTS_END -->';

// Legacy filename that was copied to workbench directory (for cleanup).
const LEGACY_CSS_DEST_FILENAME = 'candy-pop-effects.css';

// Legacy markers to clean up from previous versions.
const OLD_CSS_MARKER_START = '/* >>> CANDY POP THEME EFFECTS START <<< */';
const OLD_CSS_MARKER_END = '/* >>> CANDY POP THEME EFFECTS END <<< */';
const OLD_JS_MARKER_START_V1 = '/* >>> CANDY POP PARTICLES START <<< */';
const OLD_JS_MARKER_END_V1 = '/* >>> CANDY POP PARTICLES END <<< */';
const OLD_JS_MARKER_START_V2 = '<!-- CANDY_POP_PARTICLES_START -->';
const OLD_JS_MARKER_END_V2 = '<!-- CANDY_POP_PARTICLES_END -->';

const CANDY_CONFIG_SECTION = 'candyPop';

type EffectProfile = 'immersive' | 'balanced' | 'gentle' | 'minimal';

const DEFAULT_EFFECT_PROFILE: EffectProfile = 'immersive';

const SETTINGS_KEYS = {
  effectProfile: 'effectProfile',
  autoEnableEffects: 'autoEnableEffects',
  showWelcomeOnFirstUse: 'showWelcomeOnFirstUse',
  showGuidedTourOnUpdate: 'showGuidedTourOnUpdate',
  respectReducedMotion: 'respectReducedMotion',
} as const;

const STATE_KEYS = {
  effectsVersion: 'effectsVersion',
  appliedTheme: 'appliedTheme',
  appliedProfile: 'appliedProfile',
  appliedReducedMotion: 'appliedReducedMotion',
  welcomePromptShown: 'welcomePromptShown',
  journeyCompleted: 'journeyCompleted',
  lastSeenExtensionVersion: 'lastSeenExtensionVersion',
} as const;

interface CandySettings {
  effectProfile: EffectProfile;
  autoEnableEffects: boolean;
  showWelcomeOnFirstUse: boolean;
  showGuidedTourOnUpdate: boolean;
  respectReducedMotion: boolean;
}

interface ProfileQuickPickItem extends vscode.QuickPickItem {
  profile: EffectProfile;
}

interface ThemeQuickPickItem extends vscode.QuickPickItem {
  theme: string;
}

type GuidedTourAction =
  | 'pickTheme'
  | 'startJourney'
  | 'chooseProfile'
  | 'toggleEffects'
  | 'runHealthCheck'
  | 'openSettings'
  | 'openReadme'
  | 'finish';

interface GuidedTourQuickPickItem extends vscode.QuickPickItem {
  action: GuidedTourAction;
}

const PROFILE_OPTIONS: ReadonlyArray<ProfileQuickPickItem> = [
  {
    profile: 'immersive',
    label: 'Immersive (full candy glow)',
    description: 'Maximum sparkle, glow, and animation for the strongest visual energy.',
  },
  {
    profile: 'balanced',
    label: 'Balanced (daily default)',
    description: 'Keeps the vibe while reducing intensity and animation pressure.',
  },
  {
    profile: 'gentle',
    label: 'Gentle (calmer focus)',
    description: 'Disables starfield and heavy glow for a softer, still colorful workspace.',
  },
  {
    profile: 'minimal',
    label: 'Minimal (near-clean)',
    description: 'Removes almost all effect treatment while keeping the Candy Pop palette.',
  },
] as const;

let outputChannel: vscode.OutputChannel | undefined;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Candy Pop');
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('candyPop.enableEffects', () => {
      void enableEffects(context, false);
    }),
    vscode.commands.registerCommand('candyPop.disableEffects', () => {
      void disableEffects(context);
    }),
    vscode.commands.registerCommand('candyPop.startDelightJourney', () => {
      void startDelightJourney(context, false);
    }),
    vscode.commands.registerCommand('candyPop.startGuidedTour', () => {
      void startGuidedTour(context, 'manual');
    }),
    vscode.commands.registerCommand('candyPop.chooseEffectProfile', () => {
      void chooseEffectProfile(false);
    }),
    vscode.commands.registerCommand('candyPop.runHealthCheck', () => {
      void runHealthCheck(context);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration(`${CANDY_CONFIG_SECTION}.${SETTINGS_KEYS.effectProfile}`) ||
        e.affectsConfiguration(`${CANDY_CONFIG_SECTION}.${SETTINGS_KEYS.autoEnableEffects}`) ||
        e.affectsConfiguration(`${CANDY_CONFIG_SECTION}.${SETTINGS_KEYS.respectReducedMotion}`) ||
        e.affectsConfiguration(`${CANDY_CONFIG_SECTION}.${SETTINGS_KEYS.showWelcomeOnFirstUse}`) ||
        e.affectsConfiguration('workbench.reduceMotion')
      ) {
        void onThemeOrSettingsChanged(context);
      }
    })
  );

  void initializeExtension(context);
}

export function deactivate() {}

async function initializeExtension(context: vscode.ExtensionContext): Promise<void> {
  await maybeOfferInstallOrUpdateTour(context);
  await onThemeOrSettingsChanged(context);
}

function getActiveThemeName(): string {
  return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme') || '';
}

function isCandyEffectTheme(themeName: string): boolean {
  return CANDY_THEMES.some((theme) => theme === themeName);
}

function getCandySettings(): CandySettings {
  const config = vscode.workspace.getConfiguration(CANDY_CONFIG_SECTION);

  return {
    effectProfile: parseEffectProfile(config.get<string>(SETTINGS_KEYS.effectProfile, DEFAULT_EFFECT_PROFILE)),
    autoEnableEffects: config.get<boolean>(SETTINGS_KEYS.autoEnableEffects, true),
    showWelcomeOnFirstUse: config.get<boolean>(SETTINGS_KEYS.showWelcomeOnFirstUse, true),
    showGuidedTourOnUpdate: config.get<boolean>(SETTINGS_KEYS.showGuidedTourOnUpdate, true),
    respectReducedMotion: config.get<boolean>(SETTINGS_KEYS.respectReducedMotion, true),
  };
}

function parseEffectProfile(value: string): EffectProfile {
  if (value === 'immersive' || value === 'balanced' || value === 'gentle' || value === 'minimal') {
    return value;
  }
  return DEFAULT_EFFECT_PROFILE;
}

function shouldApplyReducedMotion(settings: CandySettings): boolean {
  if (!settings.respectReducedMotion) {
    return false;
  }

  return vscode.workspace.getConfiguration('workbench').get<boolean>('reduceMotion', false);
}

async function onThemeOrSettingsChanged(context: vscode.ExtensionContext): Promise<void> {
  const theme = getActiveThemeName();
  const settings = getCandySettings();
  const appliedVersion = context.globalState.get<number>(STATE_KEYS.effectsVersion, 0);
  const appliedTheme = context.globalState.get<string>(STATE_KEYS.appliedTheme, '');
  const appliedProfile = parseEffectProfile(
    context.globalState.get<string>(STATE_KEYS.appliedProfile, DEFAULT_EFFECT_PROFILE)
  );
  const appliedReducedMotion = context.globalState.get<boolean>(STATE_KEYS.appliedReducedMotion, false);
  const reducedMotion = shouldApplyReducedMotion(settings);

  if (isCandyEffectTheme(theme)) {
    if (settings.showWelcomeOnFirstUse) {
      void maybeOfferWelcomeJourney(context);
    }

    if (!settings.autoEnableEffects) {
      return;
    }

    if (
      appliedVersion < EFFECTS_VERSION ||
      appliedTheme !== theme ||
      appliedProfile !== settings.effectProfile ||
      appliedReducedMotion !== reducedMotion
    ) {
      await enableEffects(context, true);
    }
    return;
  }

  if (appliedVersion > 0) {
    await disableEffects(context, true);
  }
}

function getCurrentExtensionVersion(context: vscode.ExtensionContext): string {
  const packageJson = context.extension.packageJSON as { version?: string };
  return typeof packageJson.version === 'string' ? packageJson.version : '';
}

function getExtensionId(context: vscode.ExtensionContext): string {
  const packageJson = context.extension.packageJSON as { publisher?: string; name?: string };
  const publisher = typeof packageJson.publisher === 'string' ? packageJson.publisher : 'stateoftheart';
  const name = typeof packageJson.name === 'string' ? packageJson.name : 'candy-pop-themes';
  return `${publisher}.${name}`.toLowerCase();
}

async function maybeOfferInstallOrUpdateTour(context: vscode.ExtensionContext): Promise<void> {
  const currentVersion = getCurrentExtensionVersion(context);
  if (!currentVersion) {
    return;
  }

  const lastSeenVersion = context.globalState.get<string>(STATE_KEYS.lastSeenExtensionVersion, '');
  if (lastSeenVersion === currentVersion) {
    return;
  }

  const settings = getCandySettings();
  const isFirstInstall = lastSeenVersion.length === 0;
  const shouldPrompt = isFirstInstall ? settings.showWelcomeOnFirstUse : settings.showGuidedTourOnUpdate;

  await context.globalState.update(STATE_KEYS.lastSeenExtensionVersion, currentVersion);
  if (!shouldPrompt) {
    return;
  }

  // The install/update prompt replaces the older first-run prompt to avoid double messaging.
  if (isFirstInstall) {
    await context.globalState.update(STATE_KEYS.welcomePromptShown, true);
  }

  const action = await vscode.window.showInformationMessage(
    isFirstInstall
      ? 'Candy Pop installed. Want a guided tour of themes, commands, and settings?'
      : `Candy Pop updated (${lastSeenVersion} -> ${currentVersion}). Want a guided tour of new and existing features?`,
    'Start Tour',
    'Later'
  );

  if (action === 'Start Tour') {
    await startGuidedTour(context, isFirstInstall ? 'install' : 'update');
  }
}

function getGuidedTourItems(): GuidedTourQuickPickItem[] {
  return [
    {
      action: 'pickTheme',
      label: '1) Pick a Theme',
      description: 'Open the theme picker and choose Candy Pop, Light Candy Pop, or a Clean variant.',
    },
    {
      action: 'startJourney',
      label: '2) Run Delight Journey',
      description: 'Guided setup for theme, profile, and motion comfort.',
    },
    {
      action: 'chooseProfile',
      label: '3) Choose Effect Profile',
      description: 'Switch between immersive, balanced, gentle, and minimal.',
    },
    {
      action: 'toggleEffects',
      label: '4) Enable or Disable Effects',
      description: 'Manually toggle glow/effects when needed.',
    },
    {
      action: 'runHealthCheck',
      label: '5) Run Health Check',
      description: 'See diagnostics, active profile, and workbench target details.',
    },
    {
      action: 'openSettings',
      label: '6) Open Candy Pop Settings',
      description: 'Review all available settings and defaults.',
    },
    {
      action: 'openReadme',
      label: '7) Open Full Documentation',
      description: 'Open README for complete feature and troubleshooting reference.',
    },
    {
      action: 'finish',
      label: 'Finish Tour',
      description: 'Exit guided tour.',
    },
  ];
}

async function startGuidedTour(
  context: vscode.ExtensionContext,
  source: 'install' | 'update' | 'manual'
): Promise<void> {
  if (source === 'install') {
    vscode.window.showInformationMessage('Candy Pop tour started. Choose any step below; run as many as you want.');
  } else if (source === 'update') {
    vscode.window.showInformationMessage('Candy Pop update tour started. Explore commands and settings below.');
  }

  while (true) {
    const choice = await vscode.window.showQuickPick(getGuidedTourItems(), {
      title: 'Candy Pop: Guided Tour',
      placeHolder: 'Pick a step to run. You can repeat steps and finish anytime.',
      ignoreFocusOut: true,
    });

    if (!choice || choice.action === 'finish') {
      break;
    }

    await runGuidedTourAction(context, choice.action);
  }

  vscode.window.showInformationMessage(
    'Candy Pop: Tour complete. Run "Candy Pop: Start Guided Tour" anytime from the Command Palette.'
  );
}

async function runGuidedTourAction(context: vscode.ExtensionContext, action: GuidedTourAction): Promise<void> {
  switch (action) {
    case 'pickTheme':
      await vscode.commands.executeCommand('workbench.action.selectTheme');
      return;
    case 'startJourney':
      await startDelightJourney(context, true);
      return;
    case 'chooseProfile':
      await chooseEffectProfile(false);
      return;
    case 'toggleEffects': {
      const toggleChoice = await vscode.window.showQuickPick(
        [
          {
            value: 'enable',
            label: 'Enable Glow & Effects',
            description: 'Apply Candy Pop effects now.',
          },
          {
            value: 'disable',
            label: 'Disable Glow & Effects',
            description: 'Remove Candy Pop effects now.',
          },
        ],
        {
          title: 'Candy Pop: Toggle Effects',
          placeHolder: 'Choose an action.',
          ignoreFocusOut: true,
        }
      );
      if (toggleChoice?.value === 'enable') {
        await enableEffects(context, false);
      } else if (toggleChoice?.value === 'disable') {
        await disableEffects(context, false);
      }
      return;
    }
    case 'runHealthCheck':
      await runHealthCheck(context);
      return;
    case 'openSettings':
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        `@ext:${getExtensionId(context)} candyPop`
      );
      return;
    case 'openReadme':
      await openExtensionReadme(context);
      return;
    case 'finish':
    default:
      return;
  }
}

async function openExtensionReadme(context: vscode.ExtensionContext): Promise<void> {
  const readmeUri = vscode.Uri.file(path.join(context.extensionPath, 'README.md'));
  try {
    await vscode.commands.executeCommand('markdown.showPreview', readmeUri);
  } catch {
    const document = await vscode.workspace.openTextDocument(readmeUri);
    await vscode.window.showTextDocument(document, { preview: false });
  }
}

async function maybeOfferWelcomeJourney(context: vscode.ExtensionContext): Promise<void> {
  const shown = context.globalState.get<boolean>(STATE_KEYS.welcomePromptShown, false);
  if (shown) {
    return;
  }

  await context.globalState.update(STATE_KEYS.welcomePromptShown, true);

  const action = await vscode.window.showInformationMessage(
    'Candy Pop: Want a quick guided tour or a 30-second setup journey?',
    'Start Tour',
    'Start Journey',
    'Not Now'
  );

  if (action === 'Start Tour') {
    await startGuidedTour(context, 'manual');
  } else if (action === 'Start Journey') {
    await startDelightJourney(context, true);
  }
}

async function startDelightJourney(context: vscode.ExtensionContext, fromPrompt: boolean): Promise<void> {
  const theme = await chooseTheme();
  if (!theme) {
    return;
  }

  await vscode.workspace
    .getConfiguration('workbench')
    .update('colorTheme', theme, vscode.ConfigurationTarget.Global);

  let profileToUse = getCandySettings().effectProfile;

  if (isCandyEffectTheme(theme)) {
    const selectedProfile = await chooseEffectProfile(true);
    profileToUse = selectedProfile ?? getCandySettings().effectProfile;

    const motionPreference = await vscode.window.showQuickPick(
      [
        {
          label: 'Respect reduced motion (recommended)',
          value: true,
          description: 'Automatically calm animations when workbench.reduceMotion is enabled.',
        },
        {
          label: 'Always allow animations',
          value: false,
          description: 'Keep effect animations active regardless of workbench.reduceMotion.',
        },
      ],
      {
        title: 'Candy Pop Journey: Motion Comfort',
        placeHolder: 'Choose how Candy Pop should react to reduced motion settings.',
        ignoreFocusOut: true,
      }
    );

    if (motionPreference) {
      await updateCandySetting(SETTINGS_KEYS.respectReducedMotion, motionPreference.value);
    }
  }

  await context.globalState.update(STATE_KEYS.welcomePromptShown, true);
  await context.globalState.update(STATE_KEYS.journeyCompleted, true);

  const finishAction = await vscode.window.showInformationMessage(
    isCandyEffectTheme(theme)
      ? `Candy Pop: Journey complete. Theme set to ${theme}, profile set to ${profileToUse}.`
      : `Candy Pop: Journey complete. Theme set to ${theme}.`,
    'Reload Now',
    'Later'
  );

  if (finishAction === 'Reload Now') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  } else if (!fromPrompt) {
    vscode.window.showInformationMessage('Candy Pop: Setup saved. Reload when ready to apply all visual changes.');
  }
}

async function chooseTheme(): Promise<string | undefined> {
  const activeTheme = getActiveThemeName();

  const options: ThemeQuickPickItem[] = ALL_CANDY_THEMES.map((theme) => ({
    theme,
    label: theme,
    description: theme === activeTheme ? 'Current theme' : undefined,
    detail: theme.includes('Clean')
      ? 'Color palette only (no effects injection).'
      : 'Full effects variant with glow, sparkle, and glassmorphism.',
  }));

  const choice = await vscode.window.showQuickPick(options, {
    title: 'Candy Pop Journey: Choose Your Theme',
    placeHolder: 'Pick the Candy Pop theme variant you want to start with.',
    ignoreFocusOut: true,
  });

  return choice?.theme;
}

async function chooseEffectProfile(silent: boolean): Promise<EffectProfile | undefined> {
  const currentProfile = getCandySettings().effectProfile;

  const items: ProfileQuickPickItem[] = PROFILE_OPTIONS.map((option) => ({
    ...option,
    description: option.profile === currentProfile ? `${option.description} (current)` : option.description,
  }));

  const choice = await vscode.window.showQuickPick(items, {
    title: 'Candy Pop: Choose Effect Profile',
    placeHolder: 'Select how intense Candy Pop effects should feel.',
    ignoreFocusOut: true,
  });

  if (!choice) {
    return undefined;
  }

  await updateCandySetting(SETTINGS_KEYS.effectProfile, choice.profile);

  if (!silent) {
    vscode.window.showInformationMessage(`Candy Pop: Effect profile set to ${choice.profile}.`);
  }

  return choice.profile;
}

async function updateCandySetting<T>(key: string, value: T): Promise<void> {
  await vscode.workspace
    .getConfiguration(CANDY_CONFIG_SECTION)
    .update(key, value, vscode.ConfigurationTarget.Global);
}

async function enableEffects(context: vscode.ExtensionContext, silent: boolean): Promise<void> {
  try {
    const themeName = getActiveThemeName();
    const isDark = !themeName.includes('Light');
    const settings = getCandySettings();
    const reducedMotion = shouldApplyReducedMotion(settings);

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

    const baseCssContent = fs.readFileSync(cssSrcPath, 'utf8');
    const profileOverrideCss = getProfileOverrideCss(settings.effectProfile);
    const reducedMotionCss = reducedMotion ? getReducedMotionCss() : '';

    const cssContent = [baseCssContent, profileOverrideCss, reducedMotionCss]
      .filter((value) => value.trim().length > 0)
      .join('\n\n');

    let html = fs.readFileSync(workbenchPath, 'utf8');

    html = removeInjection(html, OLD_CSS_MARKER_START, OLD_CSS_MARKER_END);
    html = removeInjection(html, OLD_JS_MARKER_START_V1, OLD_JS_MARKER_END_V1);
    html = removeInjection(html, OLD_JS_MARKER_START_V2, OLD_JS_MARKER_END_V2);
    html = removeInjection(html, STYLE_MARKER_START, STYLE_MARKER_END);
    html = removeInjection(html, '<!-- CANDY_POP_INLINE_TEST -->', '<!-- /CANDY_POP_INLINE_TEST -->');

    const workbenchDir = path.dirname(workbenchPath);
    const legacyCssPath = path.join(workbenchDir, LEGACY_CSS_DEST_FILENAME);
    if (fs.existsSync(legacyCssPath)) {
      fs.unlinkSync(legacyCssPath);
    }

    const styleInjection = [
      STYLE_MARKER_START,
      `<style>${cssContent}</style>`,
      STYLE_MARKER_END,
    ].join('\n');
    html = html.replace('</head>', `${styleInjection}\n</head>`);

    atomicWriteFileSync(workbenchPath, html);
    await context.globalState.update(STATE_KEYS.effectsVersion, EFFECTS_VERSION);
    await context.globalState.update(STATE_KEYS.appliedTheme, themeName);
    await context.globalState.update(STATE_KEYS.appliedProfile, settings.effectProfile);
    await context.globalState.update(STATE_KEYS.appliedReducedMotion, reducedMotion);

    appendOutput(
      `[Enable] Applied effects (theme=${themeName}, profile=${settings.effectProfile}, reducedMotion=${reducedMotion})`
    );

    if (!silent) {
      const action = await vscode.window.showInformationMessage(
        'Candy Pop: Effects enabled! Reload to see changes.',
        'Reload Now'
      );
      if (action === 'Reload Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  } catch (err: unknown) {
    const error = normalizeError(err);
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      vscode.window.showErrorMessage(
        'Candy Pop: Permission denied. Run your IDE as Administrator to enable effects.'
      );
    } else {
      vscode.window.showErrorMessage(`Candy Pop: Failed to enable effects - ${error.message}`);
    }
  }
}

async function disableEffects(context: vscode.ExtensionContext, silent: boolean = false): Promise<void> {
  try {
    const workbenchPath = getWorkbenchHtmlPath();
    if (!workbenchPath) {
      if (!silent) {
        vscode.window.showErrorMessage('Candy Pop: Could not locate workbench file.');
      }
      return;
    }

    let html = fs.readFileSync(workbenchPath, 'utf8');

    html = removeInjection(html, OLD_CSS_MARKER_START, OLD_CSS_MARKER_END);
    html = removeInjection(html, OLD_JS_MARKER_START_V1, OLD_JS_MARKER_END_V1);
    html = removeInjection(html, OLD_JS_MARKER_START_V2, OLD_JS_MARKER_END_V2);
    html = removeInjection(html, STYLE_MARKER_START, STYLE_MARKER_END);
    html = removeInjection(html, '<!-- CANDY_POP_INLINE_TEST -->', '<!-- /CANDY_POP_INLINE_TEST -->');

    atomicWriteFileSync(workbenchPath, html);

    const workbenchDir = path.dirname(workbenchPath);
    const legacyCssPath = path.join(workbenchDir, LEGACY_CSS_DEST_FILENAME);
    if (fs.existsSync(legacyCssPath)) {
      fs.unlinkSync(legacyCssPath);
    }

    await context.globalState.update(STATE_KEYS.effectsVersion, 0);
    await context.globalState.update(STATE_KEYS.appliedTheme, '');
    await context.globalState.update(STATE_KEYS.appliedProfile, DEFAULT_EFFECT_PROFILE);
    await context.globalState.update(STATE_KEYS.appliedReducedMotion, false);

    appendOutput('[Disable] Effects removed and state reset.');

    if (!silent) {
      const action = await vscode.window.showInformationMessage(
        'Candy Pop: Effects disabled. Reload to apply.',
        'Reload Now'
      );
      if (action === 'Reload Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  } catch (err: unknown) {
    const error = normalizeError(err);
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      vscode.window.showErrorMessage('Candy Pop: Permission denied. Run your IDE as Administrator.');
    } else {
      vscode.window.showErrorMessage(`Candy Pop: Failed to disable effects - ${error.message}`);
    }
  }
}

async function runHealthCheck(context: vscode.ExtensionContext): Promise<void> {
  const theme = getActiveThemeName();
  const settings = getCandySettings();
  const reducedMotion = shouldApplyReducedMotion(settings);
  const workbenchPath = getWorkbenchHtmlPath();
  const appliedVersion = context.globalState.get<number>(STATE_KEYS.effectsVersion, 0);

  appendOutput('------------------------------------------------------------');
  appendOutput('Candy Pop health check');
  appendOutput(`Active theme: ${theme || '(none)'}`);
  appendOutput(`Effect profile: ${settings.effectProfile}`);
  appendOutput(`Auto-enable effects: ${settings.autoEnableEffects}`);
  appendOutput(`Respect reduced motion: ${settings.respectReducedMotion}`);
  appendOutput(`Reduced motion currently active: ${reducedMotion}`);
  appendOutput(`Applied effects version in state: ${appliedVersion}`);
  appendOutput(`Workbench target: ${workbenchPath || '(not found)'}`);

  if (!workbenchPath) {
    appendOutput('Hint: open VS Code/Cursor desktop build with the extension active, then run health check again.');
  }

  outputChannel?.show(true);

  const action = workbenchPath
    ? await vscode.window.showInformationMessage(
      'Candy Pop: Health check complete. Details are available in the Candy Pop output panel.',
      'Copy Workbench Path'
    )
    : await vscode.window.showInformationMessage(
      'Candy Pop: Health check complete. Workbench path was not found. See output panel for guidance.'
    );

  if (action === 'Copy Workbench Path' && workbenchPath) {
    await vscode.env.clipboard.writeText(workbenchPath);
    vscode.window.showInformationMessage('Candy Pop: Workbench path copied to clipboard.');
  }
}

function appendOutput(line: string): void {
  if (!outputChannel) {
    return;
  }

  outputChannel.appendLine(line);
}

function getProfileOverrideCss(profile: EffectProfile): string {
  switch (profile) {
    case 'balanced':
      return `
/* CANDY_POP_PROFILE: balanced */
html::before,
html::after {
  opacity: 0.72 !important;
}

.monaco-workbench .part.statusbar {
  animation-duration: 14s !important;
}

.monaco-editor .token,
.mtk4,
.mtk5,
.mtk6,
.mtk8,
.mtk9,
.mtk10 {
  text-shadow: 0 0 4px #ffffff33 !important;
}
`;
    case 'gentle':
      return `
/* CANDY_POP_PROFILE: gentle */
html::before,
html::after {
  display: none !important;
}

.monaco-editor .token,
.mtk4,
.mtk5,
.mtk6,
.mtk8,
.mtk9,
.mtk10,
.monaco-editor .bracket-highlighting-0,
.monaco-editor .bracket-highlighting-1,
.monaco-editor .bracket-highlighting-2,
.monaco-editor .bracket-highlighting-3 {
  text-shadow: none !important;
}

.tab.active,
.tab:hover,
.monaco-button,
.monaco-button:hover,
.monaco-workbench .part .badge,
.monaco-scrollable-element > .scrollbar > .slider,
.monaco-scrollable-element > .scrollbar > .slider:hover {
  box-shadow: none !important;
}

.monaco-workbench .part.statusbar {
  animation-duration: 18s !important;
}
`;
    case 'minimal':
      return `
/* CANDY_POP_PROFILE: minimal */
html::before,
html::after {
  display: none !important;
}

.monaco-editor .token,
.mtk4,
.mtk5,
.mtk6,
.mtk8,
.mtk9,
.mtk10,
.monaco-editor .bracket-highlighting-0,
.monaco-editor .bracket-highlighting-1,
.monaco-editor .bracket-highlighting-2,
.monaco-editor .bracket-highlighting-3 {
  text-shadow: none !important;
}

.monaco-workbench .part.statusbar {
  animation: none !important;
  background-size: auto !important;
}

.monaco-editor .selected-text,
.tab.active,
.tab:hover,
.monaco-button,
.monaco-button:hover,
.monaco-workbench .part .badge,
.monaco-scrollable-element > .scrollbar > .slider,
.monaco-scrollable-element > .scrollbar > .slider:hover,
.monaco-workbench .notifications-toasts .notification-toast,
.monaco-editor .suggest-widget,
.quick-input-widget {
  box-shadow: none !important;
  filter: none !important;
}
`;
    case 'immersive':
    default:
      return '';
  }
}

function getReducedMotionCss(): string {
  return `
/* CANDY_POP_RUNTIME: reduced-motion */
html::before,
html::after,
.monaco-workbench .part.statusbar,
.monaco-editor .cursors-layer .cursor,
.xterm .xterm-cursor-block,
.xterm .xterm-cursor-bar,
.xterm .xterm-cursor-underline,
.monaco-button,
.monaco-button:hover {
  animation: none !important;
  transition: none !important;
}
`;
}

function atomicWriteFileSync(filePath: string, content: string): void {
  const tmpPath = `${filePath}.candy-tmp`;
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

  const dirCandidates = [
    path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-browser'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench'),
    path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox'),
    path.join(appRoot, 'out', 'vs', 'workbench'),
  ];

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
      const candidate = path.join(dir, file);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function normalizeError(error: unknown): { code?: string; message: string } {
  if (error instanceof Error) {
    const errWithCode = error as Error & { code?: string };
    return {
      code: errWithCode.code,
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
}

# Candy Pop Themes: Real Celestial Sky and Cosmic Events

| Field | Value |
|-------|-------|
| **Author(s)** | Codex + dmarpro |
| **Status** | Implemented |
| **Created** | 2026-02-10 |
| **Last Updated** | 2026-02-10 |
| **Reviewers** | Project Maintainer |
| **Approvers** | Project Maintainer |

---

## Summary

This design upgrades Candy Pop's current CSS sparkle background into a real celestial sky system with named stars, twinkling behavior, true constellation linework, distant planets, random shooting stars, and very rare cosmic Easter egg events. The experience stays aligned with the current local-only extension architecture and profile-driven controls while introducing physics-inspired animation for supernova and black hole moments. The goal is to preserve the Candy Pop delight identity while making the sky feel intentional, recognizable, and alive.

## Context and Background

Current state (from `design-docs/1-candy-pop-themes-current-working-design.md` and `design-docs/2-delight-first-user-journey.md`):
- Effects are applied through workbench HTML injection with marker-bounded inline CSS.
- The "starfield" is currently a CSS-only tiled sparkle pattern (`html::before` / `html::after`) with drift and twinkle animations.
- Starfield-mode controls now exist (`classicSparkle`, `realCelestial`, `off`) with runtime script injection for real-celestial rendering.
- Effect intensity is controlled by profile (`immersive`, `balanced`, `gentle`, `minimal`) and reduced-motion settings.
- No celestial object identity exists today (no named stars, no constellations, no planets, no event scheduler).

Design context sources in this folder:
- `design-docs/0-template.md`
- `design-docs/1-candy-pop-themes-current-working-design.md`
- `design-docs/2-delight-first-user-journey.md`

This proposal extends the current architecture rather than replacing it: CSS glow/glass effects remain, and a new celestial runtime layer handles realistic sky content and events.

## Goals

- Goal 1: Replace generic sparkle dots with a real star catalog projection that supports visible twinkling and brightness variation.
- Goal 2: Draw real constellations (line segments between real stars) with subtle, profile-aware styling.
- Goal 3: Render distant real planets (initial set: Mars, Jupiter, Saturn; extensible to Venus/Mercury/Uranus/Neptune).
- Goal 4: Ensure famous stars are represented and identifiable in the scene: Rigel, Betelgeuse, Sirius, Alpha Centauri, Barnard's Star, Polaris.
- Goal 5: Add random shooting stars at natural-looking intervals.
- Goal 6: Add a rare Easter egg path where, after sufficient runtime, a supernova or black hole event can occur with physics-inspired behavior.
- Goal 7: Preserve accessibility and performance guardrails from the current effects architecture.

## Non-Goals

- Non-goal 1: Build an observatory-grade simulation with second-by-second astronomical precision.
- Non-goal 2: Add network calls, cloud APIs, or telemetry pipelines.
- Non-goal 3: Change color-token design of Clean themes or rebuild unrelated glow/glass systems.
- Non-goal 4: Implement full relativistic rendering; visuals are physically inspired approximations.

## Proposed Design

### Architecture Overview

Introduce a new **Celestial Scene Engine** as a runtime layer that is injected alongside existing CSS effects:

1. Catalog Layer
- Bundled static star, constellation, and planet data assets.
- Contains required famous stars and constellation edges.

2. Projection Layer
- Converts celestial coordinates (RA/Dec) into viewport coordinates.
- Applies time seed and hemisphere mode for consistent but dynamic sky orientation.

3. Renderer Layer
- Canvas overlay for stars, constellation lines, planets, shooting stars, and rare events.
- Existing CSS star pseudo-elements become fallback/compat mode.

4. Event Scheduler
- Handles timed random shooting stars.
- Tracks session runtime and rare-event probability windows.

5. Physics Layer (Easter Eggs)
- Supernova light curve and expansion simulation.
- Black hole lensing/accretion approximation for nearby stars.

6. Profile + Accessibility Adapter
- Maps current Candy Pop profiles and reduced-motion behavior to celestial intensity and animation caps.

High-level flow:

```text
Activation -> enableEffects()
  -> inject CSS + celestial runtime script
  -> runtime loads catalogs
  -> projection computes visible objects
  -> renderer draws frame loop
  -> scheduler injects transient events (shooting star / rare cosmic event)
```

### Component Design

1. Extension Injection Integration (`src/extension.ts`)
- Keep current style-marker workflow and atomic write behavior.
- Add script marker pair for celestial runtime:
  - `<!-- CANDY_POP_CELESTIAL_START -->`
  - `<!-- CANDY_POP_CELESTIAL_END -->`
- Enable/disable flow removes both style and script markers.
- Reapply when celestial-related settings change.

2. Celestial Runtime Script (`css/celestial-sky.js`)
- Creates a single fixed-position, pointer-events-none canvas above workbench layers.
- Uses `requestAnimationFrame` with frame throttling and visibility pause.
- Supports deterministic random seed per session for stable star layout + event timings.

3. Star Catalog and Famous Star Guarantees
- Data source: bundled curated subset from a permissive star catalog (for licensing safety).
- Every scene guarantees inclusion of named targets when visible by projection:
  - Rigel
  - Betelgeuse
  - Sirius
  - Alpha Centauri
  - Barnard's Star
  - Polaris
- Star rendering factors:
  - apparent magnitude -> base radius/brightness
  - spectral class -> color tint
  - scintillation model -> twinkle amplitude/frequency

4. Real Constellation Overlay
- Separate line graph dataset mapping star IDs to constellation edges.
- Render style:
  - `immersive`: visible thin neon lines + optional labels on hover/off by default.
  - `balanced`: softer lines, no labels.
  - `gentle`: optional lines only, low alpha.
  - `minimal`: off by default.
- Initial constellation set prioritized for recognizable scenes: Orion, Ursa Major, Cassiopeia, Cygnus, Scorpius.

5. Distant Planet Renderer
- Initial planets: Mars, Jupiter, Saturn.
- Visual model:
  - planet disks with subtle gradient/texture hints,
  - orbital drift over long intervals (slow movement),
  - relative brightness and apparent size scaling.
- Saturn gets ring sprite with low alpha and profile-aware intensity.

6. Shooting Star Event Engine
- Poisson-style random trigger with adjustable average interval.
- Event parameters:
  - random spawn edge,
  - velocity vector,
  - short trail with exponential fade,
  - optional fragmentation spark at termination.
- Guardrails prevent overlap storms by cooldown windows.

7. Rare Cosmic Easter Egg Engine
- Event eligibility starts only after a minimum active runtime (for example: >= 8 minutes in-session).
- Small chance check at sparse intervals (for example: every 3-5 minutes).
- Mutually exclusive event outcomes:
  - Supernova
  - Black hole formation

Supernova model (physics-inspired):
- Select eligible bright star.
- Brightness curve uses fast-rise/slow-decay profile:
  - `L(t) = L0 + Lpeak * (1 - exp(-t / tauRise)) * exp(-t / tauDecay)`
- Expanding shell radius: `r(t) = v * t`.
- Nearby stars receive temporary additive illumination falloff by distance.

Black hole model (physics-inspired):
- Collapse selected star into compact dark core.
- Apply radial lensing distortion to nearby background stars:
  - `theta' = theta + k / (r^2 + epsilon)`
- Add accretion ring with rotational shimmer and redshift-like color shift.
- Local brightness attenuation scales with inverse-square-inspired factor.

8. Profile and Reduced-Motion Mapping
- `immersive`: full celestial scene + all events enabled.
- `balanced`: all core features with reduced densities/animation amplitudes.
- `gentle`: static stars + low twinkle, planets optional, no rare events by default.
- `minimal`: celestial layer disabled unless explicitly enabled.
- If `candyPop.respectReducedMotion` and `workbench.reduceMotion=true`:
  - disable twinkle oscillation,
  - disable shooting stars,
  - disable supernova/black hole events,
  - render static low-opacity sky.

### Data Model

New bundled assets (proposed):
- `assets/celestial/stars.json`
- `assets/celestial/constellations.json`
- `assets/celestial/planets.json`

Star entry:

```json
{
  "id": "hip_32349",
  "name": "Sirius",
  "raDeg": 101.287,
  "decDeg": -16.716,
  "mag": -1.46,
  "spectral": "A1V",
  "constellation": "Canis Major"
}
```

Constellation edge entry:

```json
{
  "constellation": "Orion",
  "fromStarId": "hip_24436",
  "toStarId": "hip_25336"
}
```

Planet entry:

```json
{
  "name": "Saturn",
  "meanDistanceAu": 9.58,
  "orbitalPeriodDays": 10759,
  "apparentMagRange": [0.4, 1.2],
  "hasRings": true
}
```

Proposed additional `globalState` keys:
- `appliedCelestialMode`
- `celestialSeed`
- `lastCosmicEventTimestamp`
- `cosmicCooldownUntil`

### API Design

New/updated settings:

```json
{
  "candyPop.starfieldMode": "classicSparkle | realCelestial | off",
  "candyPop.constellationsEnabled": true,
  "candyPop.planetsEnabled": true,
  "candyPop.shootingStarFrequency": "rare | normal | frequent",
  "candyPop.cosmicEasterEggs": true
}
```

Command additions (optional but recommended):
- `candyPop.chooseStarfieldMode` - switch between classic and real celestial sky quickly.
- `candyPop.previewCelestialEvent` - debug/QA command to preview shooting star, supernova, and black hole behavior.

## Trade-offs and Alternatives Considered

### Option 1: Keep CSS-only tiled sparkle implementation

**Description:** Continue using pseudo-element radial gradients and keyframes only.

**Pros:**
- Minimal code and lowest runtime complexity.
- No new catalog data or script injection path.

**Cons:**
- Cannot represent real stars or constellations.
- Cannot support event logic (shooting stars, supernova, black hole) with adequate control.

**Why not chosen:** Does not satisfy core feature requirements.

### Option 2: Hybrid canvas runtime + curated celestial data (Chosen)

**Description:** Keep existing CSS effects and add a lightweight celestial canvas engine for astronomy features.

**Pros:**
- Supports all requested dynamic features.
- Preserves existing architecture and profile controls.
- Easier to tune complexity than full WebGL.

**Cons:**
- More moving parts (data assets + runtime scheduler).
- Requires careful performance tuning and fallback paths.

**Why chosen:** Best balance of feature completeness, maintainability, and performance risk.

### Option 3: Full WebGL/3D simulation

**Description:** Move sky rendering to shader-heavy 3D pipeline.

**Pros:**
- Highest visual ceiling.
- Better advanced effects (lensing, depth).

**Cons:**
- High implementation and compatibility risk in VS Code workbench context.
- Greater GPU usage and accessibility concerns.

**Why not chosen:** Over-scoped for current extension goals and risk tolerance.

### Chosen Approach Rationale

The hybrid canvas design can deliver realistic celestial identity and dynamic events while preserving Candy Pop's current trust model (local-only, reversible injection, profile-aware behavior).

## Cross-Cutting Concerns

### Scalability

All rendering is local. Complexity scales with object count and frame budget. Renderer should cap active objects and degrade gracefully by profile.

### Security

No network access required. Continue marker-bounded injection and cleanup with atomic writes.

### Privacy and Compliance

No telemetry or personal data collection introduced.

### Observability

Extend `candyPop.runHealthCheck` output with:
- starfield mode,
- active celestial profile mapping,
- object counts (stars/constellations/planets),
- recent event log (last shooting star, last cosmic event),
- reduced-motion override status.

### Performance

Target budgets:
- <= 2.5 ms average frame cost on common desktop hardware in `balanced` mode.
- Auto-stepdown under pressure: reduce twinkle updates, constellation alpha, and event frequency.
- Pause animation when tab is hidden.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Catalog licensing issues for real star data | Medium | High | Use permissive-source datasets and retain source attribution in repo docs |
| Event visuals reduce editor readability | Medium | Medium | Cap alpha/brightness, enforce UI-safe blend limits, profile-aware reductions |
| CPU/GPU overhead on low-end systems | Medium | High | Frame throttling, object caps, reduced-motion hard disable, fallback to classic mode |
| Astronomy inaccuracies harm credibility | Medium | Medium | Use known catalogs, deterministic projection tests, sanity checks on named stars |
| Rare events feel too frequent or too rare | Low | Medium | Configurable probabilities and cooldown windows; QA command for calibration |

## Dependencies

- `src/extension.ts`: injection orchestration, settings plumbing, and health-check expansion.
- `package.json`: new configuration keys and optional commands.
- `css/candy-pop-glow.css` and `css/light-candy-pop-glow.css`: fallback and profile compatibility.
- New runtime/data assets for celestial rendering.
- Documentation updates in `README.md` and `CHANGELOG.md`.

## Rollout Plan

### Phase 1: Celestial Foundation
- Add star/constellation/planet datasets and runtime canvas skeleton.
- Add `starfieldMode` setting with `classicSparkle` fallback.

### Phase 2: Real Sky Core
- Render real stars with twinkle and constellation overlay.
- Verify famous star coverage and profile mappings.

### Phase 3: Planet and Shooting Star Layer
- Add Mars/Jupiter/Saturn rendering.
- Add shooting-star scheduler with cooldown and profile-aware frequency.

### Phase 4: Cosmic Easter Eggs
- Add supernova/black hole event engine with runtime gating and reduced-motion constraints.
- Add QA preview command and tuning pass.

### Phase 5: UX and Documentation
- Update guided-tour steps, README feature section, settings docs, and changelog.
- Complete manual validation scenarios before release packaging.

### Rollback Strategy

- Immediate fallback: set `candyPop.starfieldMode` to `classicSparkle` or `off`.
- If runtime regressions occur, disable celestial script injection while keeping existing CSS effects.
- Full rollback: ship previous extension package version and remove new settings/commands in next patch.

## Test Plan

Automated:
- Projection math tests (RA/Dec -> viewport coordinates).
- Deterministic rendering tests with fixed seed/time.
- Event scheduler tests (shooting star interval bounds, cosmic cooldown enforcement).
- Profile mapping tests for feature enable/disable matrix.
- Implemented via `scripts/validate-celestial.cjs` (`npm run validate:celestial` / `npm run test`) with catalog integrity checks.

Manual:
- Verify named stars appear correctly in appropriate sky states.
- Validate constellation lines for Orion and Ursa Major as baseline truth checks.
- Confirm Mars/Jupiter/Saturn visual presence and slow drift.
- Confirm shooting stars trigger at expected random cadence.
- Confirm supernova/black-hole preview behavior and readability limits.
- Validate reduced-motion hard-disable behavior.
- Validate disable-effects cleanup removes celestial script and style markers.

Acceptance criteria:
- Real celestial mode is visibly distinct from current sparkle mode.
- Required named stars are included.
- Constellations and planets are present and readable.
- Shooting stars occur naturally without overwhelming editor UX.
- Rare events remain uncommon and do not disrupt workflow.

## Open Questions

- [x] Should sky orientation use local system time/latitude by default or a fixed curated orientation for consistency? Decision: use fixed seeded projection for consistent, deterministic UX.
- [x] Should famous-star labels be user-visible, hover-only, or hidden by default? Decision: visible labels for the required famous-star set.
- [x] What exact rarity target should we ship for supernova vs black-hole events (for example, 0.5% vs 0.2% per check window)? Decision: immersive ~1.8% check chance, balanced ~1.0%, with 3-5 minute check windows and cooldown.
- [x] Do we ship celestial mode as default for `immersive` only in v1, or for both `immersive` and `balanced`? Decision: keep `classicSparkle` as default and allow explicit opt-in to `realCelestial`.

## Appendix

### Minimum Famous Star Set (v1)

- Rigel
- Betelgeuse
- Sirius
- Alpha Centauri
- Barnard's Star
- Polaris

### Suggested Initial Event Tuning (Draft)

- Shooting star interval target: every 60-180 seconds on average in `balanced`.
- Cosmic event eligibility: after 8 minutes active session time.
- Cosmic chance window: evaluate every 3-5 minutes with low probability and cooldown to avoid repeats.

### Implementation Progress Note (2026-02-10)

- Completed:
  - Celestial runtime script injection (`<!-- CANDY_POP_CELESTIAL_START -->` / `<!-- CANDY_POP_CELESTIAL_END -->`) with CSP-safe external runtime file loading for strict `script-src` hosts.
  - Bundled celestial assets (`assets/celestial/stars.json`, `assets/celestial/constellations.json`, `assets/celestial/planets.json`).
  - Real star rendering with twinkle and famous-star label set (Rigel, Betelgeuse, Sirius, Alpha Centauri, Barnard's Star, Polaris).
  - Real constellation overlays (Orion, Ursa Major, Cassiopeia, Cygnus, Scorpius).
  - Distant planet rendering with orbital drift (Mars, Jupiter, Saturn plus additional catalog entries).
  - Random shooting-star scheduler with configurable frequency.
  - Rare supernova/black-hole Easter-egg events using physics-inspired formulas.
  - Adaptive performance step-down (twinkle/constellation/event pacing) under frame pressure.
  - Adaptive frame-rate throttling under pressure and explicit hidden-tab RAF pause behavior.
  - Pressure step-down now preserves required famous-star visibility while reducing non-critical star/edge density.
  - Runtime-enforced cosmic cooldown persistence and event diagnostics snapshots.
  - Optional QA command to preview celestial events.
  - Expanded diagnostics to report celestial configuration/runtime state plus active celestial profile mapping and extension-observed event metadata.
  - Automated validation script for projection determinism, scheduler bounds, cooldown gates, profile mapping, and catalog integrity.

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-10 | Codex | Initial draft |

# Mobile Tabs, Team Drag & Drop, Three.js Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile tab navigation (Partie / Menu / Paramètres), free-size teams with drag & drop and per-team rotation, sound settings, quit-with-confirmation, and a Three.js animated background with confetti/time-up effects.

**Architecture:** Pure game logic (teams, rotation, settings persistence) lives in small tested TS modules. UI is split into reusable blocks composed twice: `MobileSetup` (scroll-snap tabs + bottom bar, `< md`) and `DesktopSetup` (current single page, `md+`). One plain-Three.js `Background` canvas sits behind everything; the game triggers effects through a tiny module-level event API.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind 3, lucide-react; new: `three`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`; dev: `vitest`, `@types/three`.

**Spec:** `docs/superpowers/specs/2026-11-09-mobile-tabs-threejs-design.md`

## Global Constraints

- UI copy in French.
- Colours: Time's Up yellow/blue (Tailwind `yellow-400`, `sky-400`, `blue-600` as used today).
- Mobile layout below Tailwind `md` (768 px); desktop keeps the current single-page setup layout.
- Rules button only on the mobile Menu tab (and in the desktop page header, as today).
- 2 to 4 teams; team sizes may differ; every player belongs to a team.
- Rotation: teams alternate; each team cycles its own players independently.
- Deck size = 10 × total number of players.
- Time per turn choices: 30 / 45 / 60 s.
- Persist settings, players and teams in `localStorage`; every access wrapped in try/catch.
- 3D canvas is `aria-hidden`, honours `prefers-reduced-motion`, pixel ratio ≤ 2, pauses when `document.hidden`, can be disabled in settings.

## Review Focus

- Quitting while the timer runs: timer must stop while the confirm popup is open and resume on Annuler (Task 6 test-by-hand step).
- Removing a team or player while it is the only one left: Play must stay disabled, no crash (Task 1 `canStart` tests).
- Corrupt or old `localStorage` JSON (e.g. from a previous version with `playersPerTeam`): fall back to defaults (Task 2 test).
- Dragging a player on touch while inside the horizontal tab scroller: must not change tab (Task 4: `touch-action: none` on chips + dnd-kit `TouchSensor` with delay).
- WebGL unavailable: app works without background (Task 3: renderer creation in try/catch, render nothing).

---

### Task 1: Team logic module + test runner

**Files:**
- Create: `src/game/teams.ts`, `src/game/teams.test.ts`
- Modify: `package.json` (add `"test": "vitest run"`, devDep `vitest`)

**Interfaces:**
- Produces (`src/game/teams.ts`), using existing `Team`, `Player` from `src/types/game.ts`:
  - `addPlayer(teams: Team[], name: string): Team[]` — appends to the team with fewest players (first on tie); new id = max id + 1; trims name, ignores empty.
  - `removePlayer(teams: Team[], playerId: number): Team[]`
  - `movePlayer(teams: Team[], playerId: number, toTeamId: number, toIndex?: number): Team[]`
  - `addTeam(teams: Team[]): Team[]` — no-op at 4; name `Équipe N`.
  - `removeTeam(teams: Team[], teamId: number): Team[]` — no-op at 2; its players go one by one to the smallest remaining team; remaining teams renumbered (`id` = index, `name` = `Équipe ${i+1}`, players' `teamId` updated).
  - `shuffleTeams(teams: Team[], rand?: () => number): Team[]` — all players shuffled then dealt round-robin; sizes differ by ≤ 1.
  - `canStart(teams: Team[]): boolean` — ≥ 2 teams and each has ≥ 1 player.
  - `nextTurn(teamIndex: number, playerIdx: number[], teams: Team[]): { teamIndex: number; playerIdx: number[] }` — advances the current team's own index, then moves to the next team.
  - `defaultTeams(): Team[]` — 2 teams, `Joueur 1..4`, 2 each.

- [ ] **Step 1:** `npm i -D vitest`; add `test` script.
- [ ] **Step 2: Write failing tests** in `teams.test.ts`:
  - rotation: teams `[[A,B,C],[D,E]]`, start `(0,[0,0])`, 8 calls of `nextTurn` give speakers `A D B E C D A E`.
  - `addPlayer` on sizes `[3,2]` lands in team 2.
  - `removeTeam` on 3 teams sizes `[2,2,2]` removing team 2 → 2 teams, 6 players total, ids `0,1`, names `Équipe 1/2`, every player's `teamId` equals its team id.
  - `removeTeam` on 2 teams returns same teams; `addTeam` on 4 returns same.
  - `shuffleTeams` with 5 players, 2 teams → sizes `{2,3}`, same player id set.
  - `canStart`: `[[A],[B]]` true; `[[A,B],[]]` false.
  - `movePlayer` A from team 0 to team 1 index 0 → team 1 starts with A, team 0 lacks A, `A.teamId === 1`.
- [ ] **Step 3:** `npm test` → FAIL (module missing).
- [ ] **Step 4:** Implement `src/game/teams.ts` (pure, no mutation).
- [ ] **Step 5:** `npm test` → all PASS.
- [ ] **Step 6:** Commit `feat: team logic with per-team rotation`.

### Task 2: App settings + persistence + sound respects settings; game uses per-team rotation

**Files:**
- Create: `src/game/storage.ts`, `src/game/storage.test.ts`, `src/game/sound.ts`
- Modify: `src/types/game.ts`, `src/components/GameScreen.tsx`

**Interfaces:**
- `types/game.ts`: remove `GameSettings.playersPerTeam`; `GameState.currentPlayerIndex: number` → `playerIdx: number[]`. Add
  `export interface AppSettings { soundOn: boolean; volume: number /*0..1*/; vibration: boolean; animations: boolean }`.
- `storage.ts`:
  - `DEFAULT_APP_SETTINGS: AppSettings = { soundOn: true, volume: 0.8, vibration: true, animations: true }`
  - `load<T>(key: string, fallback: T, isValid: (v: unknown) => v is T): T` — try/catch JSON parse; invalid → fallback.
  - `save(key: string, value: unknown): void` — try/catch, silent.
  - Keys: `'timesup.app'`, `'timesup.game'` (stores `{ teams: Team[]; difficulty: Difficulty; timePerPlayer: number }`).
  - `isAppSettings(v): v is AppSettings`, `isGameSetup(v): v is GameSetup` (checks teams array of `{id,name,players[]}`, difficulty in the 3 values, time in `[30,45,60]`).
- `sound.ts`: move `createSoundEngine` out of `GameScreen.tsx`; export `soundEngine` with `playSuccess/playSkip/playTick/playTimeUp` plus `setSettings(s: AppSettings)`; master gain = `soundOn ? volume : 0`; `playSuccess` also calls `navigator.vibrate?.(60)` when `vibration`.

- [ ] **Step 1: Failing tests** `storage.test.ts` (stub `localStorage` with a Map in `beforeEach`): invalid JSON → fallback; old shape `{numberOfTeams:2, playersPerTeam:2}` under `timesup.game` → fallback; valid round-trip `save` then `load` returns equal value; `localStorage.getItem` throwing → fallback.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `storage.ts`, `sound.ts`; update types.
- [ ] **Step 4:** In `GameScreen.tsx`: import `soundEngine` from `../game/sound`; init `playerIdx: teams.map(() => 0)`; current player = `teams[teamIndex].players[playerIdx[teamIndex]]`; replace the next-team/next-player computation with `nextTurn`; deck size = `10 * teams.reduce((n,t)=>n+t.players.length,0)`; use `teams.length` instead of `settings.numberOfTeams`.
- [ ] **Step 5:** `npm test` PASS and `npm run typecheck` → only errors left in `SetupScreen.tsx` (fixed in Task 4).
- [ ] **Step 6:** Commit `feat: settings persistence, sound settings, per-team rotation in game`.

### Task 3: Three.js background + effects API

**Files:**
- Create: `src/three/Background.tsx`, `src/three/fx.ts`
- Modify: `src/App.tsx` (render `<Background mode=… enabled=… />` once, fixed, `z-0`; screens above with `relative z-10`), `package.json` (`three`, `@types/three`)

**Interfaces:**
- `fx.ts`: `type Fx = 'confetti' | 'timeup'`; `emitFx(fx: Fx): void`; `onFx(cb: (fx: Fx) => void): () => void` (unsubscribe).
- `Background.tsx`: `export default function Background({ mode, enabled }: { mode: 'menu' | 'game'; enabled: boolean })`.
  - Scene: ~14 rounded card planes (yellow `#facc15` / blue `#2563eb` / sky `#38bdf8`, white border) drifting and spinning; one hourglass (two cones + frame) slowly rotating; ~300 point particles. Blue gradient clear colour.
  - `mode === 'game'`: speed ×0.3, cards pushed toward edges.
  - `confetti`: 150 coloured points burst from centre with gravity, fade over 1.2 s. `timeup`: 300 ms red tint + camera shake.
  - `prefers-reduced-motion` or `!enabled`: render static CSS gradient div only (no canvas).
  - `setPixelRatio(Math.min(devicePixelRatio, 2))`; skip frames while `document.hidden`; resize listener; dispose geometries/materials/renderer on unmount; WebGL creation in try/catch → gradient fallback.

- [ ] **Step 1:** `npm i three @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities && npm i -D @types/three`.
- [ ] **Step 2:** Implement `fx.ts` and `Background.tsx`; mount in `App.tsx` (`mode` = `'game'` when screen is game, else `'menu'`).
- [ ] **Step 3:** `npm run dev`, open on desktop and in a mobile viewport: cards/hourglass/particles animate; enabling "reduce motion" in OS shows static gradient. Call `emitFx('confetti')` from console via a temporary `window.emitFx` to see burst, then remove it.
- [ ] **Step 4:** Commit `feat: three.js animated background and fx`.

### Task 4: Setup blocks + mobile tabs + desktop page

**Files:**
- Create: `src/components/setup/TeamsEditor.tsx`, `DifficultyPicker.tsx`, `TimePicker.tsx`, `SoundSettings.tsx`, `MobileSetup.tsx`, `DesktopSetup.tsx`
- Modify: `src/App.tsx` (owns `teams`, `difficulty`, `timePerPlayer`, `appSettings`; loads via `load`, saves via `useEffect` + `save`; calls `soundEngine.setSettings`), `src/components/SetupScreen.tsx` (becomes `<div className="md:hidden"><MobileSetup/></div><div className="hidden md:block"><DesktopSetup/></div>`)

**Interfaces:**
- Shared props: `SetupProps = { teams; setTeams; difficulty; setDifficulty; timePerPlayer; setTimePerPlayer; appSettings; setAppSettings; onPlay(): void }`.
- `TeamsEditor({ teams, setTeams })`: input + `+` button (Enter submits) → `addPlayer`; one card per team with player chips (drag handle whole chip, `touch-action:none`, ✕ → `removePlayer`, select "→ Équipe N" for tap/keyboard move → `movePlayer`); `+ Équipe` / team ✕ → `addTeam`/`removeTeam`; `Mélanger` → `shuffleTeams`. dnd-kit `DndContext` with `PointerSensor` (distance 5) and `TouchSensor` (delay 150, tolerance 5), `SortableContext` per team, `onDragOver`/`onDragEnd` → `movePlayer`.
- `MobileSetup`: horizontal `overflow-x-auto snap-x snap-mandatory` container of 3 full-width panels (Partie, Menu, Paramètres), initial scroll to Menu; bottom bar (fixed, safe-area padding, icons `Users` / `Play` / `Settings`) scrolls via `scrollTo({left: i*width, behavior:'smooth'})`; active tab from scroll position. Menu panel: animated title (CSS bounce/gradient), `DifficultyPicker`, big Play (disabled + hint "Ajoute des joueurs dans l'onglet Partie" when `!canStart`), Rules button → `RulesModal`. Partie panel: `TeamsEditor` + `TimePicker` ("Temps par tour"). Paramètres panel: `SoundSettings` (son on/off, volume slider, vibration hidden if `!('vibrate' in navigator)`, animations 3D on/off).
- `DesktopSetup`: current `SetupScreen` layout (header with Rules button, Équipes → `TeamsEditor`, Difficulté, Temps, Son, Lancer) with the same blocks; visual refresh allowed (translucent white card over the 3D background).

- [ ] **Step 1:** Implement blocks, `MobileSetup`, `DesktopSetup`, rewire `SetupScreen` and `App`.
- [ ] **Step 2:** `npm run typecheck && npm test && npm run build` → no errors.
- [ ] **Step 3:** Manual in dev at 390×844 touch emulation: swipe changes tab, bottom bar changes tab, dragging a chip between teams does not change tab, removing players until a team is empty disables Play, reload keeps players and sound settings. At 1280 px: single page, no bottom bar.
- [ ] **Step 4:** Commit `feat: mobile tabbed setup and drag & drop teams`.

### Task 5: Visual rules modal

**Files:** Modify `src/components/RulesModal.tsx`

- Keep `RulesModal({ onClose })`. Content: 3 round cards (1 « Description », 2 « Un seul mot », 3 « Mime », mêmes noms que `ResultsScreen`) each with a large icon/emoji and one sentence; a swipe illustration (card with ← « Passer » / → « Trouvé ! » arrows, animated CSS nudge); a rotation strip showing the example A → D → B → E → C → D with team colours; scoring line (1 point par carte trouvée, cartes passées remises dans le paquet). Bottom sheet style on mobile (`items-end`, rounded top), centred on desktop.

- [ ] **Step 1:** Implement; **Step 2:** check in dev on mobile and desktop; **Step 3:** commit `feat: visual rules`.

### Task 6: Quit with confirmation + fx hooks in game

**Files:** Modify `src/components/GameScreen.tsx`, `src/App.tsx`

**Interfaces:** `GameScreen` gets `onQuit: () => void`; App passes `handleBackToMenu`.

- [ ] **Step 1:** Add `confirmQuit` state; `X` button fixed top-left (always visible, above player modal); popup « Êtes-vous sûr de vouloir quitter la partie ? » with « Annuler » / « Quitter ». While `confirmQuit`: timer and countdown effects do not advance (add `confirmQuit` to their guard and deps), swipe disabled. Quitter → `onQuit()`.
- [ ] **Step 2:** `emitFx('confetti')` in `handleCardSuccess`; `emitFx('timeup')` where `playTimeUp` is called.
- [ ] **Step 3:** `npm run typecheck && npm test && npm run build` pass. Manual: start game, open quit popup at 20 s, wait 5 s, Annuler → timer still 20 s; Quitter → menu tab, teams kept. Unequal teams 3 v 2 play order A D B E C D.
- [ ] **Step 4:** Commit `feat: quit confirmation and in-game effects`.

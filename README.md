# Battle Farm Saga (Web Prototype)

Keyboard-first text RPG that evolves the original Node CLI adventure into a web-native experience using Next.js, Zustand, and TanStack Query. The abandoned CLI source is preserved in `lib/legacy/abandoned-code.js` so we can keep porting features wave by wave.

## Stack

- **Next.js App Router** with React 18 + TypeScript
- **Zustand** store (`lib/gameStore.ts`) with IndexedDB persistence via `localforage`
- **TanStack Query** for async workflows (save/load and future Supabase sync)
- **Tailwind utilities** + custom SVG assets under `public/assets`
- **Vitest** for logic-level tests (combat math, reward curves)

## Quickstart

```powershell
cd "d:\stuff for me ig\IDN Projects\Coding Stuff\text-rpg"
npm install
npm run dev
```

Browse to `http://localhost:3000`. Use the command line or the hotkey panel to run turns:

| Command | Shortcut | Description |
| --- | --- | --- |
| `attack` | `A` | Deal weapon damage to the current enemy. |
| `heal` | `H` | Restore 30% of max HP (enemy still retaliates). |
| `skip` | `S` | Hold position and let the enemy act. |
| `status` | `L` | Print the latest HP snapshot without consuming a turn. |
| `skills` | – | List learned skills and cooldowns. |
| `skill <id>` | `1-4` | Fire a specific skill: e.g. `skill 1` or `skill fertilizing-strike`. |
| `help` | `?` | Lists all available commands. |

The **Skills** card shows cooldowns and assigns number keys (1‑4) to each ability for quick activation.

## Local saves

- Zustand persist + IndexedDB keeps the current run alive between refreshes.
- The **Save & Sync** panel exposes a manual quick-save slot backed by `localforage`. Use it to branch runs or recover later.

## Directory map

```text
app/              # layout + hero + game surface
components/       # log, command input, status, save panel, controls
lib/
    ├─ logic/       # combat math helpers
    ├─ gameStore.ts # Zustand store + commands
    ├─ persistence.ts
    └─ legacy/abandoned-code.js (original CLI)
public/assets/    # SVG grid + emblem assets
tests/            # Vitest specs (add more as systems grow)
```

## Testing

```powershell
npm run test
```

Add more specs inside `tests/` as you migrate features (skills, relics, story arcs).

## Roadmap

1. Port the CLI skill/relic/event systems into modular React flows.
2. Integrate Supabase for authenticated saves + multiplayer presence.
3. Introduce cinematic story beats and upgrade dialogs inspired by the CLI events.
4. Layer additional accessibility helpers (Radix primitives, screen-reader cues, audio feedback).

Happy farming & may your crits bloom. 🌱

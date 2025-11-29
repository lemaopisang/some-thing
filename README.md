# Battle Farm Saga (Web Prototype)

Keyboard-first text RPG that evolves the original Node CLI adventure into a web-native experience using Next.js, Zustand, and TanStack Query. The abandoned CLI source is preserved in `lib/legacy/abandoned-code.js` so we can keep porting features wave by wave.

## Stack

- **Next.js App Router** with React 18 + TypeScript
- **Zustand** store (`lib/store/gameStore.ts`) with IndexedDB persistence via `localforage`
- **TanStack Query** for async workflows (save/load and future Supabase sync)
- **Tailwind utilities** + custom SVG assets under `public/assets`
- **Vitest** for logic-level tests (combat math, reward curves)

## Quickstart

```powershell
cd "d:\stuff for me ig\IDN Projects\Coding Stuff\text-rpg"
npm install
npm run dev
```

Browse to `http://localhost:3000`. The command panel exposes every core action:

| Action | Shortcut | Description |
| --- | --- | --- |
| Attack | `A` | Deal weapon damage to the current enemy. |
| Heal | `H` | Restore 30% of max HP (enemy still retaliates). |
| Skip | `S` | Hold position and let the enemy act. |
| Skills | `1-9` | When a skill is ready, use its slot number to trigger it instantly. |

Wave breaks surface as **decisions**—pick an upgrade directly from the drawer to modify stats or earn coins.

## Local saves

- Zustand persist + IndexedDB keeps the current run alive between refreshes.
- Progress lives in the `text-rpg-session` store; clear site data to start fresh.

## Directory map

```text
app/              # layout + hero + game surface
components/
    ├─ game/         # GameScreen + log, status, command UI
    └─ providers/    # shared React providers (React Query, etc.)
lib/
    ├─ logic/        # combat math helpers (legacy CLI port)
    ├─ game/         # modern session + engine abstractions
    ├─ store/        # Zustand store for the new engine
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

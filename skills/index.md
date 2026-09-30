---
description: "React adapter for @mongez/atom: atoms carry their own hooks, with ready-made presets and per-request SSR isolation. Exports `atom`, `atomCollection`, `openAtom`, `loadingAtom`, `fetchingAtom`, `portalAtom`, `AtomStoreProvider`, `useAtomStore`, `useAtom`, `HydrateAtomsScript`. Use for: \"global state in React without Redux\", \"read an atom in a component\", \"modal open/close state\", \"loading or fetching flag\", \"portal or dialog state\", \"hydrate atoms after SSR\". Not this package: framework-agnostic atoms, `derive`, persistence adapters, devtools → @mongez/atom."
---
# @mongez/react-atom

The React layer over @mongez/atom. Hooks are instance methods on the atom (`myAtom.useValue()`, `.useState()`, `.use("key")`), built on `useSyncExternalStore`, so no provider is needed for the simple client-only case. Presets cover the common UI state shapes.

## The 80% path
1. Orient with `overview.md`.
2. Create atoms and read them in components: `atoms.md`.
3. Reach for a preset before hand-rolling: `presets.md` (`openAtom`, `loadingAtom`, `fetchingAtom`, `portalAtom`).
4. Server rendering: `ssr.md` for `AtomStoreProvider`, serialising the store, and `HydrateAtomsScript` on the client.
5. Worked examples: `recipes.md`.

## Conventions and pitfalls
- Create atoms with this package's `atom` and `atomCollection` in React code so they carry the hooks; @mongez/atom's `createAtom` and `atomCollection` return atoms without them.
- `derive`, persistence and devtools come from @mongez/atom; see its skills.
- `useValue()` subscribes to the whole value; `.use("key")` subscribes to one property of an object atom, so changes to other properties do not re-render the component.
- Without an `AtomStoreProvider`, atoms are module singletons in a browser. On a server the hooks throw instead, because the singleton would leak state between requests; wrap each request.
- Per-component-instance state: `useLocalAtom({ key, default })` or `atom({ register: false })` (no registry entry, no provider needed).
- `persist` on `atom()` is read after mount by default (`persistHydration: "deferred"`), so SSR and the first client render agree.
- Preset keys must be unique, like any atom key.

# Changelog — @mongez/react-atom

## [7.0.0] — 2026-09-30

SSR/CSR correctness fixes. Requires `@mongez/atom` `^7.0.0`.

### Breaking changes

- **Server: hooks throw without an `<AtomStoreProvider>`.** The old singleton fallback (a one-time `console.warn`, silent when `NODE_ENV=production`) is removed. Wrap every server render in a provider. Browsers keep the singleton fallback.
- **`persistHydration` defaults to `"deferred"`.** Persisted atoms are no longer read at creation; the stored value is applied after mount, so it shows up one commit later. Pass `persistHydration: "immediate"` to keep the old behavior in client-only apps.
- **Provider store destruction is deferred by one tick.** An auto-created store is destroyed a tick after unmount, and not at all if the provider remounts first. Code that relied on the store being empty immediately after unmount must wait a tick.
- **Requires `@mongez/atom` `^7.0.0`** (the dependency range moved from `^6.0.0`).

### Changed (behavior)

- **Hooks now throw on a server when no `<AtomStoreProvider>` is mounted** (`src/scope.ts`, `src/store.tsx`). If there is no provider and no `document`, `useAtom(template)`, `useAtom(key)` and every atom hook (`useValue`, `useState`, `use`, `useWatch`, `Provider`) throw an error that names the atom key and the fix. The old one-time `console.warn` (silent when `NODE_ENV=production`) is removed. In a browser the singleton fallback is unchanged. Atoms created with `register: false` never throw.
- **`persist` is read after mount.** `atom()` now defaults to `persistHydration: "deferred"`: storage is not read while the atom is created (import time) and never on the server. The hooks call `atom.hydratePersisted()` in an effect, which applies the stored value with `update()`. The first client render therefore matches the server render; a persisted value appears one commit later. Pass `persistHydration: "immediate"` to keep the old read-at-creation behavior in client-only apps. Scoped store clones were never persisted and still are not.
- **`<AtomStoreProvider>` destroys its auto-created store a tick after unmount**, and not at all if the provider mounts again first. A synchronous destroy in the effect cleanup left a StrictMode remount holding an emptied store and destroyed clones. A store passed via `store` is still never destroyed.

### Fixed

- **Store clones seeded from the template's current value**, so a stray `template.update()` on the server leaked into later requests. Clones now start from the default value or `initialValues` (see `@mongez/atom`).
- **Hooks on a scoped clone made a clone of the clone.** `useAtom(t).useValue()` resolved through `store.use(this)` with `this` already scoped. Resolution is now idempotent, so both call shapes read the same atom.
- **`getServerSnapshot` was the live `getSnapshot`.** It now returns the store's hydrated value, frozen at the first read, so the first client render matches the server HTML even if effects mutate the store while later boundaries still hydrate. Atoms without a store use their default value.
- **`use(key)` / `watch` never fired for atoms declared with `default: null`** (see `@mongez/atom`).
- **`template.destroy()` unsubscribed mounted store clones** (see `@mongez/atom`).

### Added

- **`useLocalAtom(options)`** for state that belongs to one component instance: `register: false`, ignores `<AtomStoreProvider>`, works on the server without a provider, key suffixed with `.local.<n>`, destroyed after unmount (StrictMode-safe).
- **`atom({ register: false })`** and **`atomCollection({ register: false })`**.
- **`persistHydration`** option on `atom()` (see above).
- **`"sideEffects": false`** in `package.json`.

## [6.0.10] — 2026-08-17

### Security

- **`serializeSnapshot` now escapes `<!--`** (`src/ssr.tsx`). The serializer already escaped `</script`, which stops the obvious breakout, but `<!--` inside the payload switches the HTML parser from "script data state" into "script data escaped state" — and in that state the *real* `</script>` React emits next is swallowed as data rather than closing the element. Everything after it, up to the next `</script>`, is then parsed as script. Since a snapshot is by definition server state (records, user input, API values) embedded into the page, that's an XSS path that the `</script` escape alone did not close. `<!--` is now escaped to `<\!--` alongside the existing `</script` and U+2028/U+2029 escapes; the JSON parses identically.

### Added

- **Development warning when an atom hook falls back to the module-level singleton outside a browser** (`src/store.tsx`). Without a mounted `<AtomStoreProvider>`, hooks use the singleton atom — correct for a client-only app (one process, one user), but on an SSR server it means every concurrent request reads and writes the *same* object, so one user's state can be rendered into another user's page. The fallback can't simply be removed without breaking the documented client-only usage, so it now warns once per process when it is hit with no `document` present. Silent in the browser and in `NODE_ENV=production`; no behaviour change either way.

## [6.0.9] — 2026-05-27

### Fixed

- **React 18 tearing across every hook**. `useState`, `useValue`, `use(key)`, `useWatch` previously used the `useState + useEffect(onChange)` pattern. Between the synchronous render snapshot and the effect-time subscription, the atom could change → stale read → siblings could disagree on the same atom's value during a concurrent render. Every hook is now built on `useSyncExternalStore`.
- **`useState()` returned a fresh setter every render**. `[value, atom.update.bind(atom)]` produced a new function identity on each render. Any consumer putting the setter in a `useEffect` / `useCallback` deps array would loop or re-fire. Setter now stabilized with `useCallback`.
- **`use(key)` returned the closure variable, not state**. The hook read `atom.get(key)` once at the top of the function and returned that local — the `useState` was only used as a re-render trigger; its actual state was never read. Subtle tear window. Now reads via `useSyncExternalStore` directly.
- **`AtomProvider` left a `console.log(currentAtoms)` in production**. Removed.
- **`AtomProvider` updated atoms in `useEffect` after first paint**. Children rendered with the OLD atom value, then re-rendered with the new value — visible flicker on SSR / hydration. The new `<AtomStoreProvider>` applies `initialValues` synchronously via `silentUpdate` in a `useState` initializer; children see the hydrated value on first paint.
- **`Provider` action passed `Partial<Value>` as full `Value`**. The action stored `props.value as Value` directly; consumers passing a partial got a destructive object replacement. Documented; consumers needing partial updates should use `merge`.
- **`clone` action overwrote the original atom**. The previous React-side `clone()` spread the original `data` (including `key`) and re-registered into the global `atoms` map — stomping the original. Now routes through the base atom's `clone({ register: false })` which uses the deterministic counter suffix.
- **`LoadingAtom` type was mis-parameterized**. The exported type `ReactAtom<LoadingAtomActions> & LoadingAtomActions` passed `LoadingAtomActions` as the `Value` generic, making `atom.value` typed as the actions bag. Fixed to `ReactAtom<boolean, LoadingAtomActions>`.

### Added

- **`AtomStore` integration**. `<AtomStoreProvider>` scopes atoms per subtree (per SSR request, per test, per multi-tenant boundary). Children of the provider operate on store-scoped clones of every atom they touch; without a provider, hooks fall back to the module-level singleton (correct client-only default).
  - **`useAtomStore()`**: returns the active `AtomStore | null`.
  - **`useAtom(template | key)`**: overloaded — pass an atom to resolve to its scoped clone, or pass a key to look up a scoped atom by string.
  - **`useResolvedAtom`**: deprecated alias of `useAtom`. Will be removed in v7.
  - Auto-destruction on provider unmount for stores created internally; externally-supplied `store` prop is caller-owned.
- **`useSyncExternalStore` everywhere**. Per-atom hooks (`useState`, `useValue`, `use`, `useWatch`) are tear-free under concurrent rendering. The setter returned by `useState()` is stable across renders.
- **`AbortSignal` and stable references**. Hooks pass the latest closure via refs; clones use deterministic keys.
- **SSR helpers in the main barrel** (no `/ssr` subpath):
  - **`serializeSnapshot(snapshot, options?)`** — JSON-stringifies a snapshot with XSS protection: `</script>` is escaped, `U+2028`/`U+2029` are escaped to their JS forms.
  - **`serializeStore(store, options?)`** — convenience over `serializeSnapshot(store.snapshot())`.
  - **`<HydrateAtomsScript snapshot={...} id? nonce? />`** — emits a typed `<script type="application/json">` carrying the payload.
  - **`readHydration(id?)`** — client-side picker. Returns `null` on the server, on missing tag, or on malformed JSON (with a console error for visibility).
  - **`DEFAULT_HYDRATION_SCRIPT_ID`** — `"__mongez_atom_state"`.
- **Backwards-compatibility shims**.
  - **`AtomContext`**: deprecated alias of `AtomStoreContext`.
  - **`AtomProvider`**: deprecated shim over `<AtomStoreProvider>`, maps `register` → `initialAtoms` and `defaultValue` → `initialValues`.
- **End-to-end SSR test suite**: server snapshot → client hydrate round-trip with no console errors, concurrent-request isolation across stores, lazy hydration of atoms not yet touched server-side, streaming renderer (`renderToPipeableStream`) under a real Node environment.
- **AI kit**: `llms.txt`, `llms-full.txt`, `skills/` (`README`, `overview`, `atoms`, `presets`, `ssr`, `recipes`).
- **CI**. Node 18/20/22 × Ubuntu, Node 20 × Windows, React 18 + React 19.

### Changed

- **`useAtom(key)` semantics changed**. Previously a context-bound clone lookup that only worked under the old `AtomProvider`. Now an overloaded function: `useAtom(template)` resolves to the store-scoped clone (recommended path); `useAtom(key)` is the legacy escape hatch — returns `undefined` when no provider is mounted or the key has not been used yet.
- **Per-atom hooks return the store-scoped clone's values when a provider is mounted**. Previously they always read from the module-level template. If your app relied on the singleton behavior under what is now an `AtomStoreProvider`, you'll see different values.
- **React 18 minimum**. Was `react > 16.8`. Now `react >= 18` to enable `useSyncExternalStore`.
- **`peerDependencies: { "react": ">=18.0.0" }`** updated accordingly.

### Removed

- **`AtomContext` as a typed key→atom record**. Now an alias of `AtomStoreContext` (whose value is an `AtomStore | null`).
- **The legacy `useAtom(key)` from `context.tsx`**. Folded into the overloaded `useAtom` in `store.tsx`.

### Tests

```
44 tests across react-atom, helpers, store, ssr (synchronous + streaming), ssr-helpers
```

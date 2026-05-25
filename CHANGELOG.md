# Changelog — @mongez/react-atom

## Unreleased

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

### Changed (breaking)

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

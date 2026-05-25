# Migration — @mongez/react-atom

## 5.x → 6.0 (upcoming)

The headline change is **React 18 is now the minimum**: hooks are rebuilt on `useSyncExternalStore`, which closes the React 18 concurrent-rendering tearing window. There are a few API surface shifts; the rest is fixes that you'll only notice if you were relying on the old buggy behavior.

### React version

```diff
- "peerDependencies": { "react": ">16.8.0" }
+ "peerDependencies": { "react": ">=18.0.0" }
```

If your app is still on React 16/17, stay on `@mongez/react-atom@5`. There's no plan to backport.

### `useAtom` has new semantics

`useAtom` used to be a context-bound `key → atom` lookup that only worked under the old `AtomProvider`. Now it's an overloaded function:

- `useAtom(template: Atom)` → returns the **store-scoped clone** if an `<AtomStoreProvider>` is mounted above, or the template itself otherwise. **This is the form you usually want.**
- `useAtom(key: string)` → legacy escape hatch. Returns `Atom | undefined` (undefined when no provider is mounted or the key hasn't been used yet).

```diff
-import { AtomProvider, useAtom } from "@mongez/react-atom";
-
-function App() {
-  const user = useAtom("user");      // string → context lookup
-  return <p>{user?.value.name}</p>;
-}
-
-<AtomProvider register={[userAtom]}>
-  <App />
-</AtomProvider>
+import { AtomStoreProvider, useAtom } from "@mongez/react-atom";
+
+function App() {
+  const user = useAtom(userAtom);    // template → scoped clone
+  return <p>{user.value.name}</p>;
+}
+
+<AtomStoreProvider initialAtoms={[userAtom]}>
+  <App />
+</AtomStoreProvider>
```

The old `<AtomProvider>` is preserved as a deprecated shim that maps to `<AtomStoreProvider>` so your existing code still works while you migrate.

### Per-atom hooks now resolve against the active store

`atom.useValue()`, `atom.useState()`, `atom.use(key)`, and `atom.useWatch(key, cb)` already resolve internally — they call `useAtom(template)` under the hood. The functional behavior is unchanged when you're not using a provider (singleton fallback). When you ARE inside an `<AtomStoreProvider>`, these hooks now read from the scoped clone, not the module-level template.

**If your app relied on hooks always reading from the template even under a provider, you'll see different values.** That was the SSR bug we set out to fix; this is the intentional new behavior.

### `useSyncExternalStore` rebuild

All hooks (`useValue`, `useState`, `use`, `useWatch`) are rebuilt on `useSyncExternalStore`. Two concrete differences:

1. **The `setValue` returned by `useState()` is a stable function** — same identity across renders. Code that put it in `useEffect`/`useCallback` deps used to loop or re-fire; now it's stable.
2. **Reads are tear-free** under React 18 concurrent rendering. You should not see two components disagreeing on the same atom's value during a concurrent render anymore.

If you depended on the old `[value, atom.update.bind(atom)]` setter identity changing per render, you'll need to add your own state mirror. (Unusual case.)

### `<AtomProvider>` is now a thin shim

The old `<AtomProvider>` did several things wrong (the `console.log`, the post-paint state push, the bring-back-the-whole-global-registry default for `register`). The new `<AtomStoreProvider>` does what you actually want; the legacy shim translates props:

```diff
-<AtomProvider register={[userAtom]} defaultValue={{ user: { name: "Alice" } }}>
+<AtomStoreProvider initialAtoms={[userAtom]} initialValues={{ user: { name: "Alice" } }}>
   <App />
-</AtomProvider>
+</AtomStoreProvider>
```

### Removed

- `useResolvedAtom` — never released. The name was a working draft; it's just `useAtom(template)`.
- `AtomContext` as a typed `Record<string, Atom>` — now an alias of `AtomStoreContext` (whose value is `AtomStore | null`). Direct consumers of the old context shape need to use `useAtomStore()` instead.
- The legacy `useAtom(key)` from `context.tsx` — folded into the overloaded `useAtom` in `store.tsx`.

### New features (no migration needed)

| Feature | Notes |
|---|---|
| `<AtomStoreProvider>` | Per-subtree atom isolation. The SSR primitive you've been wanting. |
| `useAtomStore()` | Returns the active `AtomStore`. |
| `<HydrateAtomsScript>` | Emits a typed `<script type="application/json">` with the snapshot. |
| `readHydration()` | Client-side picker for the embedded snapshot. |
| `serializeSnapshot` / `serializeStore` | XSS-safe JSON serializer (escapes `</script>` and U+2028/U+2029). |

### SSR pattern after migration

```tsx
// Next.js App Router server component
import { renderToString } from "react-dom/server";
import { createAtomStore } from "@mongez/atom";
import { AtomStoreProvider, HydrateAtomsScript } from "@mongez/react-atom";
import { userAtom } from "@/state/user";

export default function Layout({ children, currentUser }) {
  const store = createAtomStore();
  store.use(userAtom).update(currentUser);

  return (
    <AtomStoreProvider store={store}>
      {children}
      <HydrateAtomsScript snapshot={store.snapshot()} />
    </AtomStoreProvider>
  );
}
```

```tsx
// Client root
"use client";
import { AtomStoreProvider, readHydration } from "@mongez/react-atom";

export function ClientRoot({ children }) {
  return (
    <AtomStoreProvider initialValues={readHydration() ?? undefined}>
      {children}
    </AtomStoreProvider>
  );
}
```

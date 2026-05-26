---
name: mongez-react-atom-overview
description: |
  High-level overview of `@mongez/react-atom` — what it exports, how its React hooks and `AtomStoreProvider` work, and where it fits relative to `@mongez/atom` and other packages.
  TRIGGER when: code imports `atom`, `atomCollection`, `openAtom`, `loadingAtom`, `fetchingAtom`, `portalAtom`, `AtomStoreProvider`, `AtomStoreContext`, `useAtom`, `useAtomStore`, `HydrateAtomsScript`, `readHydration`, `serializeStore`, `serializeSnapshot`, `ReactAtom`, or `ReactActions` from `@mongez/react-atom`; user asks "what is @mongez/react-atom", "which hooks does an atom expose", "how does it relate to @mongez/atom", or "does it work with React 18 useSyncExternalStore"; typical import `import { atom, AtomStoreProvider } from "@mongez/react-atom"`.
  SKIP: deep-dives on a specific feature — atom factory and per-atom hooks use `mongez-react-atom-atoms`, preset atoms use `mongez-react-atom-presets`, SSR/hydration uses `mongez-react-atom-ssr`, copy-paste flows use `mongez-react-atom-recipes`; the framework-agnostic atom primitive lives in `@mongez/atom`; server-state caching belongs in `@mongez/atomic-query`.
---
# Overview

`@mongez/react-atom` makes every `@mongez/atom` value first-class in React: each atom carries hooks (`useValue`, `useState`, `use`, `useWatch`) and a `Provider` component as instance methods. Subscriptions are wired through `useSyncExternalStore`, so reads stay tear-free under React 18 concurrent rendering.

## Install

```sh
yarn add @mongez/react-atom
# peer: react >= 18, @mongez/atom
```

## Import pattern

```ts
import {
  atom,
  atomCollection,
  openAtom,
  loadingAtom,
  fetchingAtom,
  portalAtom,
  AtomStoreProvider,
  AtomStoreContext,
  useAtom,
  useAtomStore,
  HydrateAtomsScript,
  readHydration,
  serializeStore,
  serializeSnapshot,
  type ReactAtom,
  type ReactActions,
} from "@mongez/react-atom";
```

## The hooks every atom carries

```ts
const userAtom = atom({ key: "user", default: { name: "Anon", age: 0 } });

userAtom.useValue();           // subscribes; returns the whole value
userAtom.useState();           // returns [value, setValue]
userAtom.use("name");          // subscribes to ONE key
userAtom.useWatch("name", cb); // effect-style subscription
<userAtom.Provider value={...} />  // pushes a value into the atom on mount
```

All four hooks honor the nearest `<AtomStoreProvider>`. When no provider is mounted, they operate on the module-level singleton — the correct default for client-only apps.

## SSR mental model

```
<AtomStoreProvider>            // creates a per-request store on first render
  <YourApp>                    // every useValue() / useState() / use() resolves
                               // to the store-scoped clone, not the global atom
  </YourApp>
</AtomStoreProvider>
```

For hydration, see [`ssr.md`](./ssr.md).

## Scope boundaries

| Concern | Lives where |
|---|---|
| Framework-agnostic atom + actions | `@mongez/atom` |
| Server-state cache with query keys | `@mongez/atomic-query` |
| Event bus | `@mongez/events` |

## React version

React 18+ only. `useSyncExternalStore` is required.

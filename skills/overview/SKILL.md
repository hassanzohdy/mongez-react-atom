---
name: mongez-react-atom-overview
description: High-level overview of @mongez/react-atom — what it exports, how its React hooks and AtomStoreProvider work, and where it fits relative to @mongez/atom and other packages.
when_to_use: User asks what @mongez/react-atom is or how it works, user sees an import from "@mongez/react-atom" and wants to understand the package, user asks which hooks an atom exposes (useValue/useState/use/useWatch/Provider), user asks about React 18 useSyncExternalStore integration, user wants to understand AtomStoreProvider scope boundaries.
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

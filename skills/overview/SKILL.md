---
name: mongez-react-atom-overview
description: |
  High-level overview of @mongez/react-atom — per-atom React hooks, presets (openAtom, loadingAtom, fetchingAtom, portalAtom), and per-request SSR isolation via AtomStoreProvider.
---

# @mongez/react-atom — Overview

The React adapter for [`@mongez/atom`](/atom/overview/). Every atom carries React hooks (`useValue`, `useState`, `use(key)`, `useWatch`) and a `Provider` component as **instance methods** — no `useAtomValue` / `useSetAtom` split, no provider for the simple case. Subscriptions wire through `useSyncExternalStore`, so reads stay tear-free under React 18 concurrent rendering.

## Highlighted features

<div class="mongez-highlights">

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="14.5" y1="9.5" x2="17.5" y2="6.5"/><line x1="6.5" y1="17.5" x2="9.5" y2="14.5"/></svg>
  <h3>Per-atom hooks</h3>
  <p><code>myAtom.useValue()</code>, <code>myAtom.useState()</code>, <code>myAtom.use("key")</code>. No global hook + atom-as-argument ceremony.</p>
</div>

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  <h3>Tear-free under React 18</h3>
  <p>Built on <code>useSyncExternalStore</code> — safe for concurrent rendering, transitions, and Suspense boundaries.</p>
</div>

<div class="mongez-highlight" data-accent="fire">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  <h3>Preset atoms</h3>
  <p><code>openAtom</code> for toggles, <code>loadingAtom</code> for flags, <code>fetchingAtom</code> for the lifecycle, <code>portalAtom</code> for modal-with-payload — the 80% you'd otherwise rewrite per project.</p>
</div>

<div class="mongez-highlight" data-accent="bolt">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  <h3>SSR-isolated stores</h3>
  <p><code>&lt;AtomStoreProvider&gt;</code> creates a per-request store. Module-level singletons stay safe; per-user state stays scoped.</p>
</div>

</div>

## Install

```sh
npm install @mongez/react-atom
# or: yarn add @mongez/react-atom
# or: pnpm add @mongez/react-atom
```

Peer: `react >= 18`. `@mongez/atom` installs automatically.

## Quick peek

```tsx
import { atom } from "@mongez/react-atom";

const counterAtom = atom({ key: "counter", default: 0 });

function Counter() {
  const count = counterAtom.useValue();
  return (
    <button onClick={() => counterAtom.update(count + 1)}>
      Count: {count}
    </button>
  );
}
```

Every atom carries its own hooks. No `useAtomValue(counterAtom)` ceremony, no provider needed for client-only apps.

## The hooks every atom carries

```ts
const userAtom = atom({ key: "user", default: { name: "Anon", age: 0 } });

userAtom.useValue();           // subscribe; returns the whole value
userAtom.useState();           // returns [value, setValue]
userAtom.use("name");          // subscribes to ONE key
userAtom.useWatch("name", cb); // effect-style subscription
<userAtom.Provider value={...} />  // pushes a value into the atom on mount
```

All four honour the nearest `<AtomStoreProvider>`. When no provider is mounted they operate on the module-level singleton in a browser — the correct default for client-only apps — and throw on a server, where that singleton would be shared by every request. For per-instance state use `useLocalAtom()` or `atom({ register: false })`.

## Scope boundaries

| Concern | Lives where |
|---|---|
| Framework-agnostic atom + actions | [`@mongez/atom`](/atom/overview/) |
| Server-state cache with query keys | [`@mongez/atomic-query`](/atomic-query/overview/) |
| Event bus | [`@mongez/events`](/events/overview/) |

## Where to go next

- **[Atoms](../atoms/)** — `atom(...)`, per-atom hooks, custom actions
- **[Preset atoms](../presets/)** — `openAtom`, `loadingAtom`, `fetchingAtom`, `portalAtom`
- **[SSR & stores](../ssr/)** — `<AtomStoreProvider>`, hydration helpers
- **[Recipes](../recipes/)** — toggles, modals, fetch lifecycles, Next.js / Remix / TanStack Start hydration

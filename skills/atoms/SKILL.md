---
name: mongez-react-atom-atoms
description: |
  How to create atoms and atomCollections in React and use their per-instance hooks (`useValue`, `useState`, `use`, `useWatch`, `Provider`) and custom actions.
  TRIGGER when: code imports `atom`, `atomCollection`, or `useAtom` from `@mongez/react-atom`; code calls `.useValue()`, `.useState()`, `.use(key)`, `.useWatch(key, cb)`, or renders `<someAtom.Provider>`; user asks "how do I create an atom in React", "what's the difference between useValue and useState", "how do I subscribe to one key only", or "how do I add a custom action to a React atom"; typical import `import { atom, atomCollection } from "@mongez/react-atom"`.
  SKIP: framework-agnostic atom primitive (`createAtom`, `createAtomCollection`) — that lives in `@mongez/atom`, the core layer this package sits on top of; preset-atom shorthands (`openAtom`/`loadingAtom`/`fetchingAtom`/`portalAtom`) use `mongez-react-atom-presets`; per-request SSR scoping and hydration use `mongez-react-atom-ssr`; copy-paste end-to-end flows use `mongez-react-atom-recipes`.
---
# Atoms in React

## Factory

```ts
import { atom, atomCollection } from "@mongez/react-atom";

const counterAtom = atom({ key: "counter", default: 0 });
const todosAtom   = atomCollection<Todo>({ key: "todos", default: [] });
```

> **Naming convention**: suffix atom variables with `Atom` (e.g. `counterAtom`, `userAtom`). This prevents name collisions with local variables and plain values, and makes it immediately clear at the call site that you're working with a reactive atom.

`atom(...)` is the React-aware version of `createAtom` from `@mongez/atom`. The returned atom carries all the base methods plus the React hooks below.

## The hooks every atom carries

### `useValue()`

Subscribes to changes; returns the current value. Re-renders when the value changes.

```tsx
function Greeting() {
  const user = userAtom.useValue();
  return <h1>Hello {user.name}</h1>;
}
```

### `useState()` — available but not recommended

Returns `[value, setValue]` — same shape as React's `useState`, but the value lives in the atom.

```tsx
function Counter() {
  const [count, setCount] = counterAtom.useState();
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

The setter accepts an updater function: `setCount(prev => prev + 1)`.

**Prefer `useValue()` + calling the atom's methods directly** — it keeps updates explicit and traceable:

```tsx
// ✅ preferred
function Counter() {
  const count = counterAtom.useValue();
  return <button onClick={() => counterAtom.update(count + 1)}>{count}</button>;
}

// Or better — give the increment semantic meaning via an action:
const counterAtom = atom({
  key: "counter",
  default: 0,
  actions: { increment() { this.update(this.value + 1); } },
});

function Counter() {
  const count = counterAtom.useValue();
  return <button onClick={() => counterAtom.increment()}>{count}</button>;
}
```

### `use(key)`

For object atoms: subscribes to ONE key only. Re-renders only when THAT key changes — sibling keys in the same atom don't wake this component.

```tsx
function NameOnly() {
  const name = userAtom.use("name");
  return <span>{name}</span>;
}
// Even if userAtom.merge({ age: 31 }), this component doesn't re-render.
```

### `useWatch(key, callback)`

Effect-style watcher. Use when you want a side effect (analytics, logging) without re-rendering. `useWatch` is itself a hook — call it at the top of your component, NOT inside a `useEffect`.

```tsx
function NameTracker() {
  userAtom.useWatch("name", (next, prev) =>
    analytics.track("name_changed", { from: prev, to: next }),
  );
  return null;
}
```

### `Provider`

A React component that sets the atom's value on mount and updates it when `value` prop changes.

```tsx
<userAtom.Provider value={initialUser}>
  <App />
</userAtom.Provider>
```

Useful for testing (inject a known value into the subtree) and for "set on mount" patterns.

## Custom actions in React atoms

Action methods declared in the factory still work — they're bound to the atom instance, available globally.

```ts
const auth = atom<AuthState, { login: (creds: Creds) => Promise<void> }>({
  key: "auth",
  default: { user: null },
  actions: {
    async login(creds) {
      const user = await api.login(creds);
      this.merge({ user });
    },
  },
});

// Anywhere:
await auth.login({ email, password });

// In components:
const user = auth.use("user");
```

## With store scoping (SSR)

```tsx
function Component() {
  // `useAtom(template)` resolves to the active store's scoped clone.
  // Without a provider, it returns the template itself (singleton mode).
  const scoped = useAtom(userAtom);
  const value = scoped.useValue();   // tear-free read
  return <span>{value.name}</span>;
}
```

The per-atom hooks (`useValue`, `useState`, `use`, `useWatch`) ALREADY do this resolution internally — you don't need to call `useAtom(template)` explicitly unless you're invoking action methods on the scoped clone from an event handler. See [`ssr.md`](./ssr.md).

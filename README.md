<div align="center">

# @mongez/react-atom

**React hooks layer on top of [`@mongez/atom`](https://github.com/hassanzohdy/atom) — every atom carries its own `useValue` / `useState` / `use(key)` / `useWatch` / `<Provider>`, plus preset atoms for toggles, loading flags, fetch lifecycles, and modal portals, all SSR-safe.**

[![npm](https://img.shields.io/npm/v/@mongez/react-atom.svg)](https://www.npmjs.com/package/@mongez/react-atom)
[![license](https://img.shields.io/npm/l/@mongez/react-atom.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mongez/react-atom.svg)](https://bundlephobia.com/package/@mongez/react-atom)
[![downloads](https://img.shields.io/npm/dw/@mongez/react-atom.svg)](https://www.npmjs.com/package/@mongez/react-atom)

</div>

---

## Why @mongez/react-atom?

`useState` is component-local — sharing a value across siblings means lifting it or wiring a context every time. `Zustand` and `Jotai` solve sharing but each invent their own `create` / `atom()` shape, their own hook conventions (`useStore`, `useAtom`/`useAtomValue`/`useSetAtom`), and their own escape hatches for SSR. `Recoil` is heavier, less actively maintained, and still requires you to write atoms and selectors with selector wrappers.

`@mongez/react-atom` is the React hooks layer on top of [`@mongez/atom`](https://github.com/hassanzohdy/atom) — the same framework-agnostic atom you already know, just with hooks attached as instance methods. **One atom, multiple hooks on it.** No `useAtomValue` / `useSetAtom` distinction, no selector wrappers, no second mental model. All built on `useSyncExternalStore` so reads are tear-free under React 18 concurrent rendering, and an `<AtomStoreProvider>` ships in the box for per-request SSR isolation.

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

---

## Features

| Feature | Description |
|---|---|
| **Hooks on every atom** | `useValue`, `useState`, `use(key)`, `useWatch`, and `<Provider>` are instance methods on the atom — no `useAtomValue` / `useSetAtom` split. |
| **Granular subscriptions** | `atom.use("name")` re-renders only when `name` changes; sibling keys in the same atom don't wake the component. |
| **Tear-free under React 18** | Every hook is built on `useSyncExternalStore` — concurrent rendering can't show two components disagreeing on the same atom. |
| **Stable setter identity** | `useState()` returns a setter with the same identity across renders — safe in `useEffect` / `useCallback` deps without looping. |
| **Preset atoms** | `openAtom`, `loadingAtom`, `fetchingAtom`, and `portalAtom` collapse 80% of state work to one line. |
| **`<AtomStoreProvider>`** | Per-subtree atom isolation — each SSR request gets its own scoped clones. Concurrent requests can't see each other's state. |
| **Hydration helpers** | `<HydrateAtomsScript>`, `readHydration()`, and `serializeStore` ship a server-to-client transport with `</script>` and U+2028/U+2029 escaped. |
| **TypeScript-first** | Atom value and action types flow into every hook; `use("name")` is typed to the keys of the atom's value. |
| **Backward-compatible** | Legacy `<AtomProvider>` and `AtomContext` survive as deprecated shims while you migrate. |
| **Zero registry coupling** | Module-level singleton mode is the default — providers are opt-in for SSR and isolation. |

---

## Installation

```sh
npm install @mongez/react-atom
```

```sh
yarn add @mongez/react-atom
```

```sh
pnpm add @mongez/react-atom
```

Peer dependencies: `react >= 18`. The package depends on [`@mongez/atom`](https://github.com/hassanzohdy/atom) directly — installing this package also installs that core layer.

> **React 18 or newer is mandatory.** `useSyncExternalStore` is required, and there is no plan to backport. If you're on React 16/17, stay on `@mongez/react-atom@5`.

---

## Quick start

Create an atom, mount its hooks anywhere — no provider, no context wiring.

```tsx
// atoms/counter.ts
import { atom } from "@mongez/react-atom";

export const counterAtom = atom({
  key: "counter",
  default: 0,
  actions: {
    increment() { this.update(this.value + 1); },
    decrement() { this.update(this.value - 1); },
    reset()     { this.update(0); },
  },
});
```

```tsx
// components/Counter.tsx
import { counterAtom } from "../atoms/counter";

export function Counter() {
  const count = counterAtom.useValue();
  return (
    <div>
      <button onClick={() => counterAtom.decrement()}>−</button>
      <span>{count}</span>
      <button onClick={() => counterAtom.increment()}>+</button>
      <button onClick={() => counterAtom.reset()}>reset</button>
    </div>
  );
}
```

Any other component that calls `counterAtom.useValue()` subscribes to the same value — no lifting, no context. That's the entire surface for client-only apps. Everything below is depth on the same handful of exports.

---

## Atoms and their hooks

`atom(options)` is the React-aware version of `createAtom` from `@mongez/atom`. The returned atom carries every base method (`update`, `merge`, `change`, `onChange`, ...) plus a small set of hooks bound to the instance.

### `atom.useValue()`

Subscribes to the atom; returns the current value; re-renders the component whenever the value changes.

```tsx
const user = userAtom.useValue();
return <h1>Hello {user.name}</h1>;
```

### `atom.useState()`

Returns `[value, setValue]` — the same shape as React's `useState`, but the value lives in the atom and is visible to every other subscriber.

```tsx
const [count, setCount] = counterAtom.useState();
return <button onClick={() => setCount(count + 1)}>{count}</button>;
```

The setter accepts an updater function: `setCount(prev => prev + 1)`.

> **The setter's identity is stable across renders.** Safe to list in `useEffect` / `useCallback` dependency arrays without re-triggering or looping. This is the React-18 rebuild paying off — pre-v6 code that put the setter in deps used to misbehave.

**Prefer `useValue()` + calling the atom's methods directly.** It keeps updates explicit and traceable, especially when paired with custom actions:

```tsx
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

### `atom.use(key)`

For object-valued atoms: subscribes to **one key only**. Re-renders only when that key changes — sibling keys in the same atom don't wake the component.

```tsx
const profileAtom = atom({
  key: "profile",
  default: { name: "Anon", email: "", lastSeen: 0 },
});

function NameDisplay() {
  const name = profileAtom.use("name");
  return <span>{name}</span>;
}

// Updating lastSeen does NOT re-render NameDisplay.
setInterval(() => profileAtom.change("lastSeen", Date.now()), 1000);
```

`use(key)` is typed against the atom's value shape — `profileAtom.use("nope")` is a compile error.

### `atom.useWatch(key, callback)`

Effect-style watcher. Fires the callback when the key changes, but **doesn't re-render the host component**. Use for analytics, logging, persistence side-effects.

```tsx
function AnalyticsTracker() {
  userAtom.useWatch("name", (next, prev) => {
    analytics.track("name_changed", { from: prev, to: next });
  });
  return null;
}
```

### `<atom.Provider value={…}>`

A React component that pushes a value into the atom on mount and on `value` prop change. Useful for testing (inject a known value into the subtree) and for "set on mount" patterns where state comes from props.

```tsx
function App({ initialTheme }) {
  return (
    <themeAtom.Provider value={initialTheme}>
      <RestOfApp />
    </themeAtom.Provider>
  );
}
```

> **`<atom.Provider>` updates via `useEffect`** — the value is applied after first paint, not synchronously during render. The first frame still reads the atom's pre-existing value. For SSR-correct pre-fill, use `<AtomStoreProvider initialValues={...}>` instead.

### `atomCollection(options)`

The React-aware version of `atomCollection` from `@mongez/atom`. Inherits the array helpers (`push`, `unshift`, `pop`, `shift`, `remove`, `replace`, ...) AND every hook above.

```tsx
import { atomCollection } from "@mongez/react-atom";

type Todo = { id: number; text: string; done: boolean };
const todosAtom = atomCollection<Todo>({ key: "todos", default: [] });

todosAtom.push({ id: 1, text: "Buy bread", done: false });

function TodoList() {
  const todos = todosAtom.useValue();
  return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}
```

> **Naming convention:** suffix atom variables with `Atom` (e.g. `counterAtom`, `userAtom`) — prevents collisions with locals and makes it obvious at call sites that you're working with a reactive value.

---

## Preset atoms

Four pre-built atom shapes that collapse the most common state patterns to one line. They're regular atoms underneath — every base method and every React hook still works.

### `openAtom(key, defaultOpened?)`

A boolean-shaped toggle with `open`, `close`, `toggle`, and a `useOpened()` hook.

```tsx
import { openAtom } from "@mongez/react-atom";

const sidebarAtom = openAtom("sidebar", /* defaultOpened */ false);

function ToggleButton() {
  return <button onClick={() => sidebarAtom.toggle()}>≡</button>;
}

function Sidebar() {
  const opened = sidebarAtom.useOpened();
  return opened ? <Drawer /> : null;
}
```

### `loadingAtom(key, defaultLoading?)`

A boolean with `startLoading` / `stopLoading` / `toggleLoading` verbs. Use it when you just need a flag — for richer fetch state, reach for `fetchingAtom`.

```tsx
import { loadingAtom } from "@mongez/react-atom";

const usersLoadingAtom = loadingAtom("usersLoading");

async function fetchUsers() {
  usersLoadingAtom.startLoading();
  try {
    const users = await api.users.list();
    setUsers(users);
  } finally {
    usersLoadingAtom.stopLoading();
  }
}
```

### `fetchingAtom<DataType, PaginationType>(key, defaultValue?, defaultFetching?)`

A full fetch lifecycle in one atom. Value shape: `{ isLoading, data, error, pagination? }`. Actions: `startLoading`, `stopLoading`, `success(data, pagination?)`, `failed(error)`, `append(data)`, `prepend(data)`. Hooks: `useLoading()`, `useData()`, `useError()`, `usePagination()`. See the [paginated fetch recipe](#wire-a-paginated-fetch-with-fetchingatom) below for a full flow.

`defaultFetching` is `true` by default — the atom starts in a loading state so the first render shows a spinner even before `startLoading()` is called.

> **`fetchingAtom` is for one-off fetch flows, not a query cache.** It has no key-based deduping, no automatic refetch, no stale-while-revalidate. For server-state caching with invalidation, refetch-on-focus, and optimistic updates, use [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query).

### `portalAtom<T>(name, opened?)`

A coordinator atom for modals, drawers, tooltips, dropdowns. Holds `{ opened: boolean, data: T }` and exposes `open(data?)`, `close()`, `toggle(data?)`, `useOpened()`, `useData()`. See the [modal recipe](#open-a-modal-from-anywhere-with-portalatom) below for a full trigger/consumer pair.

> **The portal atom's internal key is suffixed with `-portal`.** `portalAtom("deleteUser")` registers an atom whose key is `deleteUser-portal`. This is only visible when hydrating by key — the variable you exported still works as expected.

---

## SSR — `<AtomStoreProvider>`

The module-level `atoms` registry is shared per Node process. Two concurrent SSR requests on the same server would see each other's mutations — a classic SSR state-leakage bug. `<AtomStoreProvider>` solves this by giving each request its own scoped clone of every atom touched inside it.

```tsx
import { AtomStoreProvider } from "@mongez/react-atom";

<AtomStoreProvider>
  <App />
</AtomStoreProvider>
```

Without a provider, atoms fall back to the module-level singleton — the correct default for client-only SPAs.

### Props

```ts
type AtomStoreProviderProps = {
  store?: AtomStore;                       // bring your own; otherwise auto-created
  initialAtoms?: Atom<any>[];              // pre-register these in the store
  initialValues?: Record<string, unknown>; // hydration values keyed by atom key
  children: React.ReactNode;
};
```

| Prop | Behaviour | Note |
|---|---|---|
| `store` | An existing `AtomStore` to use. | Caller owns the lifecycle — the provider does NOT destroy it on unmount. |
| `initialAtoms` | Atom templates to pre-register on first render. | Required if you want `initialValues` to apply to atoms that no component has touched yet. |
| `initialValues` | Initial values keyed by atom key. | Applied via silent update so the first render of subscribers sees the hydrated values — no flash. |

When `store` is omitted, the provider auto-creates one and **destroys it on unmount.**

### Per-request isolation

Two providers in the same tree are fully independent — useful for multi-tenant dashboards, A/B splits, or per-route boundaries.

```tsx
<>
  <AtomStoreProvider>
    <TenantA />
  </AtomStoreProvider>
  <AtomStoreProvider>
    <TenantB />
  </AtomStoreProvider>
</>
```

### `useAtom(template | key)` and `useAtomStore()`

```ts
useAtom<V, A>(template: Atom<V, A>): Atom<V, A>;     // → store-scoped clone (or template if no provider)
useAtom<V>(key: string): Atom<V> | undefined;        // → scoped atom by key, or undefined
useAtomStore(): AtomStore | null;                    // → the active store
```

The per-atom hooks (`useValue`, `useState`, `use`, `useWatch`) already do this resolution internally — you only need `useAtom(template)` explicitly when calling an action method from an event handler under SSR. See the [SSR-safe action recipe](#call-an-action-method-safely-under-ssr) below. The string overload is a legacy escape hatch left over from v5; prefer the template form.

`useAtomStore()` returns the active `AtomStore` or `null` — reach for it when you need to snapshot on demand, manually hydrate from a custom transport, or integrate with a non-React layer.

### Hydration helpers

```ts
serializeSnapshot(snapshot, options?): string
serializeStore(store, options?): string
readHydration(id?: string): Record<string, unknown> | null

<HydrateAtomsScript snapshot={…} id?={…} nonce?={…} />
```

| Helper | Purpose |
|---|---|
| `serializeSnapshot` | XSS-safe JSON for a `<script>` tag — escapes `</script>` and U+2028/U+2029. |
| `serializeStore` | Convenience over `serializeSnapshot(store.snapshot())`. |
| `<HydrateAtomsScript>` | Renders an inline `<script type="application/json">` carrying the snapshot. Place it once per provider. |
| `readHydration` | Client-side picker that parses the script tag. Returns `null` if missing or malformed. |
| `DEFAULT_HYDRATION_SCRIPT_ID` | The DOM id `<HydrateAtomsScript>` and `readHydration` agree on: `"__mongez_atom_state"`. |

> **Skip these helpers if your framework already has a typed server-to-client transport.** Next.js (`__NEXT_DATA__`), Remix (`useLoaderData`), and TanStack Start (route `loader`) all have their own. Feed the snapshot straight into `<AtomStoreProvider initialValues={…}>` instead of round-tripping through an inline script.

---

## Recipes

### Share a user atom across components with granular subscriptions

Reach for this when multiple components consume slices of the same value. `useValue()` re-renders on every change; `use("name")` re-renders only when that single key changes — important for fields that update frequently (lastSeen, presence, cursor position).

```tsx
// atoms/user.ts
import { atom } from "@mongez/react-atom";

type User = { id: number; name: string; email: string; lastSeen: number };

export const currentUserAtom = atom<User | null>({
  key: "currentUser",
  default: null,
  actions: {
    async signIn(email: string, password: string) {
      this.update(await api.auth.signIn({ email, password }));
    },
    signOut() { this.update(null); },
  },
});
```

```tsx
// components/Header.tsx — re-renders on ANY field change
import { currentUserAtom } from "../atoms/user";

export function Header() {
  const user = currentUserAtom.useValue();
  if (!user) return <a href="/login">Sign in</a>;
  return <span>Hello, {user.name}</span>;
}

// components/AccountEmail.tsx — re-renders ONLY when `email` changes.
// Frequent `lastSeen` updates don't wake this component.
export function AccountEmail() {
  const email = currentUserAtom.use("email");
  return <small>{email}</small>;
}

export function SignOutButton() {
  return <button onClick={() => currentUserAtom.signOut()}>Sign out</button>;
}
```

### Open a modal from anywhere with `portalAtom`

Reach for this when a modal, drawer, or dialog opens from list rows, header buttons, or keyboard shortcuts and you don't want to lift its open/close state to a common ancestor. The trigger and the modal don't need to share a parent — the atom is the bridge.

```tsx
// atoms/modals.ts
import { portalAtom } from "@mongez/react-atom";

export const editUserModal = portalAtom<{ id: number; initialName: string }>("editUser");
```

```tsx
// components/UserRow.tsx — trigger
import { editUserModal } from "../atoms/modals";

function UserRow({ user }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>
        <button onClick={() => editUserModal.open({ id: user.id, initialName: user.name })}>
          Edit
        </button>
      </td>
    </tr>
  );
}
```

```tsx
// components/EditUserModal.tsx — render once at the app root
import { editUserModal } from "../atoms/modals";

export function EditUserModal() {
  const opened = editUserModal.useOpened();
  const data = editUserModal.useData();
  if (!opened) return null;
  return (
    <Dialog onClose={() => editUserModal.close()}>
      <h2>Edit user</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        await api.users.update(data.id, /* ... */);
        editUserModal.close();
      }}>
        <input defaultValue={data.initialName} />
        <button>Save</button>
      </form>
    </Dialog>
  );
}
```

### Wire a paginated fetch with `fetchingAtom`

Reach for this when a single endpoint feeds a single piece of UI and you don't need cache invalidation or refetch — settings forms, dashboard panels, detail pages. `success`, `failed`, `append`, and `prepend` each set `isLoading: false` in one merge — no `finally` wrapper needed.

```tsx
// atoms/products.ts
import { fetchingAtom } from "@mongez/react-atom";

type Product = { id: number; name: string; price: number };
type Pagination = { page: number; pages: number };

export const productsAtom = fetchingAtom<Product[], Pagination>("products");

export async function loadProducts(page = 1) {
  productsAtom.startLoading();
  try {
    const { data, pagination } = await api.products.list({ page });
    productsAtom.success(data, pagination);
  } catch (err) {
    productsAtom.failed(err);
  }
}
```

```tsx
// components/ProductsList.tsx
import { productsAtom, loadProducts } from "../atoms/products";

export function ProductsList() {
  const isLoading = productsAtom.useLoading();
  const products = productsAtom.useData();
  const error = productsAtom.useError();

  React.useEffect(() => { loadProducts(); }, []);

  if (error) return <p className="text-red-500">{String(error)}</p>;
  if (!products && isLoading) return <Spinner />;
  return <ul>{products?.map(p => <li key={p.id}>{p.name} — ${p.price}</li>)}</ul>;
}
```

### Hydrate atoms in SSR (Next.js App Router)

Reach for this when you need the first client render to match the server HTML — current user, feature flags, initial page data. Without hydration the client starts from `default` and renders a loading state (or a different UI than the server), causing a hydration mismatch or visible flash.

```tsx
// atoms/user.ts — shared between server and client
import { atom } from "@mongez/react-atom";

type User = { id: number; name: string; role: "admin" | "viewer" } | null;
export const currentUserAtom = atom<User>({ key: "currentUser", default: null });
```

```tsx
// app/layout.tsx — SERVER component
import { createAtomStore } from "@mongez/atom";
import { AtomStoreProvider, HydrateAtomsScript } from "@mongez/react-atom";
import { getCurrentUser } from "@/lib/auth";
import { currentUserAtom } from "@/atoms/user";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();          // server-only round-trip
  const store = createAtomStore();
  store.use(currentUserAtom).update(user);      // pre-fill the store

  return (
    <html lang="en">
      <body>
        <AtomStoreProvider store={store}>
          {children}
          <HydrateAtomsScript snapshot={store.snapshot()} />
        </AtomStoreProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx — CLIENT boundary
"use client";
import { AtomStoreProvider, readHydration } from "@mongez/react-atom";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AtomStoreProvider initialValues={readHydration() ?? undefined}>
      {children}
    </AtomStoreProvider>
  );
}
```

`currentUserAtom.useValue()` is never `null` on first render now — the server already fetched it and the client store starts pre-filled. Same pattern works for Remix (load in a `loader`, pass via `useLoaderData`) and TanStack Start (route `loader` plus a client root); skip `<HydrateAtomsScript>` / `readHydration()` in those and feed the snapshot straight into `initialValues`.

### Call an action method safely under SSR

Reach for this when an event handler calls an action method (`auth.logout()`, `cart.checkout()`) inside a component rendered under `<AtomStoreProvider>`. Calling the module-level atom directly mutates the template, which is shared across concurrent SSR requests — a leak between users. Use `useAtom(template)` to grab the per-request scoped clone instead.

```tsx
import { useAtom } from "@mongez/react-atom";

// Wrong under SSR — mutates the shared module-level template.
function BadLogoutButton() {
  return <button onClick={() => authAtom.logout()}>Log out</button>;
}

// Right — resolves to the per-request scoped clone under a provider.
function LogoutButton() {
  const auth = useAtom(authAtom);
  return <button onClick={() => auth.logout()}>Log out</button>;
}
```

On the client (no provider), `useAtom(template)` falls back to the template itself, so the safe form works everywhere. The per-atom hooks (`useValue`, `useState`, `use`, `useWatch`) already do this resolution internally — you only need `useAtom(template)` when calling action methods outside a hook.

### Isolate atom state per test

Reach for this in unit tests when you want every test to start from a clean slate. Wrapping each render in `<AtomStoreProvider>` gives every test its own scoped store — the module-level template stays untouched between runs.

```tsx
// __tests__/UserBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { AtomStoreProvider } from "@mongez/react-atom";
import { currentUserAtom } from "../atoms/user";
import { UserBadge } from "../components/UserBadge";

test("renders user name when atom is pre-filled", () => {
  render(
    <AtomStoreProvider
      initialValues={{ currentUser: { id: 1, name: "Alice", email: "a@x.com" } }}
    >
      <UserBadge />
    </AtomStoreProvider>,
  );
  expect(screen.getByText("Alice")).toBeInTheDocument();
});

test("renders 'Guest' when atom is at default", () => {
  render(
    <AtomStoreProvider>
      <UserBadge />
    </AtomStoreProvider>,
  );
  expect(screen.getByText("Guest")).toBeInTheDocument();
});
```

For a quick subtree pre-fill without an entire `AtomStoreProvider`, `<currentUserAtom.Provider value={…}>` also works — but it pushes the value via `useEffect`, so the first frame still reads the previous value. `<AtomStoreProvider initialValues={…}>` applies synchronously before first render.

### Enable Redux DevTools

Reach for this in development builds when you want to see every atom update in the Redux DevTools extension — preset atoms, fetch atoms, and portal atoms all show up.

```ts
// app entry — runs once at boot
import { enableAtomDevtools } from "@mongez/atom";

if (process.env.NODE_ENV !== "production") {
  enableAtomDevtools({ name: "MyReactApp" });
}
```

Time-travel works: rewinding a `fetchingAtom` from `success` back to `startLoading` rolls the connected `UsersList` back to its spinner state.

> **Strip the import in production.** The bridge subscribes to every atom and serialises every update — fine in dev, wasteful in a shipped bundle. The `process.env.NODE_ENV` check above is the standard guard.

---

## TypeScript

Atom value and action types flow into every hook automatically. `ReactAtom<V, A>` extends `Atom<V, A>` from `@mongez/atom` with the React-aware actions; type generic helpers that read from an atom via a hook as `ReactAtom<V, A>` rather than the base `Atom<V, A>`.

```ts
import type {
  ReactAtom,
  ReactActions,
  OpenAtomActions, OpenAtomType,
  LoadingAtom, LoadingAtomActions,
  FetchingAtomType, FetchingAtomActions,
  AtomPortal, PortalActions,
  AtomStoreProviderProps, HydrateAtomsScriptProps,
} from "@mongez/react-atom";

function useFirstChar<V extends { name: string }>(atom: ReactAtom<V>) {
  return atom.use("name")[0];   // `use("nope")` would be a compile error
}
```

---

## Migration

The v5 → v6 jump moves the package to React 18+ only and rebuilds every hook on `useSyncExternalStore` for tear-free concurrent reads. The `<AtomStoreProvider>` surface is new; legacy `<AtomProvider>` / `AtomContext` survive as deprecated shims that translate to the new types. Full diff and step-by-step migration in [`MIGRATION.md`](./MIGRATION.md).

---

## Related packages

| Package | Use when you need |
|---|---|
| [`@mongez/atom`](https://github.com/hassanzohdy/atom) | The framework-agnostic atom primitive this package wraps. Use it directly in vanilla / Vue / non-React code, or alongside this package for stores, `derive`, and persistence. |
| [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query) | Server-state cache for React with query keys, invalidation, refetch-on-focus, and optimistic updates. Built on top of this package — use it instead of hand-rolled `fetchingAtom` flows once you outgrow them. |
| [`@mongez/events`](https://github.com/hassanzohdy/events) | Cross-feature pub/sub. The atom's `onChange` covers most local subscription needs; reach for events when multiple unrelated features need to coordinate. |
| [`@mongez/cache`](https://github.com/hassanzohdy/mongez-cache) | Pluggable cache facade — drop into `@mongez/atom`'s `persist` slot for free localStorage / encrypted / runtime persistence on atoms shared with this package. |

---

## Further reading

- [`MIGRATION.md`](./MIGRATION.md) — v5 → v6 transition guide.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes.
- [`llms-full.txt`](./llms-full.txt) — exhaustive single-file API surface for tool-assisted development.
- [`skills/`](./skills) — per-topic deep-dives (atoms, presets, SSR, recipes).

---

## License

MIT

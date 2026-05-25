# @mongez/react-atom

> React adapter for [`@mongez/atom`](https://github.com/hassanzohdy/atom). Hooks on every atom, `<AtomStoreProvider>` for SSR isolation, preset atoms for the common 80% of state work, hydration helpers, and `useSyncExternalStore` under the hood so reads are tear-free under React 18 concurrent rendering.

## Install

```sh
yarn add @mongez/react-atom
# peer: react >= 18, @mongez/atom
```

## A 30-second tour

```tsx
import {
  atom,
  openAtom,
  loadingAtom,
  fetchingAtom,
  portalAtom,
} from "@mongez/react-atom";

// 1. Any atom gets per-atom hooks
const counter = atom({ key: "counter", default: 0 });

function Counter() {
  const [count, setCount] = counter.useState();
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 2. Preset atoms collapse common patterns
const sidebar = openAtom("sidebar");
sidebar.toggle();
const opened = sidebar.useOpened();    // → boolean

const loginPending = loadingAtom("loginPending");
loginPending.startLoading();

const usersFetch = fetchingAtom<User[]>("users");
usersFetch.success(data);              // sets isLoading=false, data
const isLoading = usersFetch.useLoading();
const users = usersFetch.useData();

// 3. Modals with payload
const editUserModal = portalAtom<{ id: number; name: string }>("editUser");
editUserModal.open({ id: 7, name: "Alice" });
const opened = editUserModal.useOpened();
const data = editUserModal.useData();
```

## What's in the box

| Export | Purpose |
|---|---|
| `atom`, `atomCollection` | React-aware atom factories (wrap `@mongez/atom`). |
| `openAtom`, `loadingAtom`, `fetchingAtom`, `portalAtom` | Preset atoms for common state shapes. |
| `<AtomStoreProvider>` | Scopes atoms per subtree (per SSR request, per test, etc.). |
| `useAtom(template \| key)` | Resolve to store-scoped clone (or template). |
| `useAtomStore()` | Returns the active `AtomStore \| null`. |
| `<HydrateAtomsScript>` | Emits a typed `<script>` tag with the snapshot. |
| `readHydration()` | Client-side picker for the embedded snapshot. |
| `serializeSnapshot`, `serializeStore` | XSS-safe JSON serializers. |

## Hooks every atom carries

```ts
const userAtom = atom({ key: "user", default: { name: "Anon", age: 0 } });

userAtom.useValue();              // → V, re-renders on any change
userAtom.useState();              // → [V, (next) => void], stable setter
userAtom.use("name");             // → V[K], subscribes to ONE key only
userAtom.useWatch("name", cb);    // effect-style; doesn't re-render this component
<userAtom.Provider value={initial}>...</userAtom.Provider>
```

All built on `useSyncExternalStore`. Reads are tear-free under React 18+ concurrent rendering. The setter returned by `useState()` is a **stable function** across renders — safe to put in `useEffect` / `useCallback` deps without looping.

When an `<AtomStoreProvider>` is mounted above, these hooks operate on the store-scoped clone. Without a provider, they operate on the module-level singleton — the correct default for client-only SPAs.

## Preset atoms

### `openAtom`

```ts
const m = openAtom("sidebar", /* defaultOpened */ false);
m.open(); m.close(); m.toggle();
const opened = m.useOpened();
```

### `loadingAtom`

```ts
const l = loadingAtom("fetching.users");
l.startLoading(); l.stopLoading(); l.toggleLoading();
```

### `fetchingAtom`

Full fetch lifecycle: `isLoading`, `data`, `error`, optional `pagination`.

```ts
const usersAtom = fetchingAtom<User[]>("users");

async function loadUsers() {
  usersAtom.startLoading();
  try {
    const data = await api.users.list();
    usersAtom.success(data);
  } catch (err) {
    usersAtom.failed(err);
  }
}

function UsersList() {
  const isLoading = usersAtom.useLoading();
  const data = usersAtom.useData();
  const error = usersAtom.useError();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox e={error} />;
  return <ul>{data?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

For server-data caching with invalidation/refetch/optimistic updates, use [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query) instead.

### `portalAtom`

A coordinator atom for modals, drawers, tooltips. Holds `{ opened: boolean, data: T }`.

```tsx
const deleteUserModal = portalAtom<{ userId: number; userName: string }>("deleteUser");

// Anywhere:
<button onClick={() => deleteUserModal.open({ userId: 7, userName: "Alice" })}>
  Delete
</button>

// In the modal:
function ConfirmDelete() {
  const opened = deleteUserModal.useOpened();
  const { userId, userName } = deleteUserModal.useData();
  if (!opened) return null;
  return (
    <Dialog>
      <p>Delete {userName}?</p>
      <button onClick={() => deleteUserModal.close()}>Cancel</button>
      <button onClick={async () => {
        await api.users.remove(userId);
        deleteUserModal.close();
      }}>
        Delete
      </button>
    </Dialog>
  );
}
```

## SSR — `<AtomStoreProvider>`

The module-level `atoms` registry is shared per Node process. Two concurrent SSR requests would see each other's state. `<AtomStoreProvider>` gives each request its own scoped clones.

```tsx
import { AtomStoreProvider } from "@mongez/react-atom";

<AtomStoreProvider>
  <App />
</AtomStoreProvider>
```

Props:

```ts
type AtomStoreProviderProps = {
  store?: AtomStore;                         // bring your own; caller-owned lifecycle
  initialAtoms?: Atom<any>[];                // pre-register
  initialValues?: Record<string, unknown>;   // silent-update on entry
  children: React.ReactNode;
};
```

Without a `store` prop, the provider auto-creates one and destroys it on unmount.

### End-to-end pattern (Next.js App Router)

```tsx
// app/layout.tsx (server component)
import { createAtomStore } from "@mongez/atom";
import { AtomStoreProvider, HydrateAtomsScript } from "@mongez/react-atom";
import { userAtom } from "@/state/user";

export default async function Layout({ children }) {
  const store = createAtomStore();
  store.use(userAtom).update(await getCurrentUser());

  return (
    <AtomStoreProvider store={store}>
      {children}
      <HydrateAtomsScript snapshot={store.snapshot()} />
    </AtomStoreProvider>
  );
}
```

```tsx
// app/client-root.tsx
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

Same pattern works for Remix (`loader` + `useLoaderData`) and TanStack Start (route `loader`).

## `useAtom(template | key)`

```ts
useAtom<V, A>(template: Atom<V, A>): Atom<V, A>;
useAtom<V>(key: string): Atom<V> | undefined;
```

**Template overload** → store-scoped clone (or the template itself when no provider is mounted). Use it when calling action methods from an event handler so they hit the scoped clone in SSR-safe code:

```tsx
function LogoutButton() {
  const auth = useAtom(authAtom);  // resolves to the active store's clone
  return <button onClick={() => auth.logout()}>Log out</button>;
}
```

The per-atom hooks (`useValue`, `useState`, `use`, `useWatch`) already do this resolution internally — you only need `useAtom(template)` explicitly when calling action methods.

**String overload** → look up a scoped atom by string key. Legacy escape hatch; prefer the template form.

## Hydration helpers

```ts
serializeSnapshot(snapshot, options?): string
serializeStore(store, options?): string
readHydration(id?: string): Record<string, unknown> | null

<HydrateAtomsScript snapshot={...} id? nonce? />
```

`serializeSnapshot` escapes `</script>` and U+2028/U+2029 so the payload is safe inside an inline `<script type="application/json">`. `<HydrateAtomsScript>` renders the script tag for you; `readHydration()` is the client-side picker.

## Devtools

```ts
import { enableAtomDevtools } from "@mongez/atom";

if (process.env.NODE_ENV !== "production") {
  enableAtomDevtools({ name: "MyApp" });
}
```

Pipes every atom (including preset atoms, fetch atoms, portal atoms) into the Redux DevTools extension. Time-travel works.

## What this package does NOT do

- The atom primitive itself → [`@mongez/atom`](https://github.com/hassanzohdy/atom)
- Server-state caching with query keys / invalidation / refetch → [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query)
- The event bus → [`@mongez/events`](https://github.com/hassanzohdy/events)

## React version

React **18 or newer**. `useSyncExternalStore` is required. There are no plans to support 16/17; those users should stay on `@mongez/react-atom@5`.

## Migration

See [`MIGRATION.md`](./MIGRATION.md) for the v5 → v6 transition.

## License

MIT

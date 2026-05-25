---
name: mongez-react-atom-recipes
description: Concrete copy-paste recipes for common @mongez/react-atom patterns: toggles, modals with payload, fetch flows, granular subscriptions, SSR hydration, SSR-safe action handlers, and devtools setup.
when_to_use: User wants a working example of a specific @mongez/react-atom pattern, user asks how to wire up a modal with portalAtom, user asks how to do a fetch flow with fetchingAtom, user asks how to subscribe to a single object key, user asks how to call an action method from an event handler safely under SSR, user wants to enable Redux DevTools for atoms.
---
# Recipes

Common flows across the React adapter's features.

## Toggle + content separation

```ts
const sidebar = openAtom("sidebar");

function Toggle() {
  return <button onClick={() => sidebar.toggle()}>≡</button>;
}

function Sidebar() {
  const opened = sidebar.useOpened();
  return opened ? <Drawer /> : null;
}
```

## Modal with payload

```ts
const editUserModal = portalAtom<{ id: number; initialName: string }>("editUser");

// From a list:
<button onClick={() => editUserModal.open({ id: u.id, initialName: u.name })}>Edit</button>

// In the modal component:
function EditUserModal() {
  const opened = editUserModal.useOpened();
  const data = editUserModal.useData();
  if (!opened) return null;
  return <Dialog onClose={() => editUserModal.close()}>...{data.initialName}...</Dialog>;
}
```

## Fetch flow with `fetchingAtom`

```ts
const usersAtom = fetchingAtom<User[]>("users");

export async function loadUsers() {
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
  if (error) return <p className="text-red-500">{String(error)}</p>;
  return <ul>{data?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

For richer caching/invalidation, use [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query) instead.

## Granular subscriptions on object atoms

```ts
const profile = atom({
  key: "profile",
  default: { name: "Anon", email: "", lastSeen: 0 },
});

// Only re-renders when `name` changes.
function NameDisplay() {
  const name = profile.use("name");
  return <span>{name}</span>;
}

// Updating `lastSeen` does NOT re-render `NameDisplay`.
setInterval(() => profile.change("lastSeen", Date.now()), 1000);
```

## SSR snapshot/hydrate (Next.js)

```tsx
// app/layout.tsx (server component)
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

## Action method from an event handler (SSR-safe)

```tsx
import { useAtom } from "@mongez/react-atom";

function LogoutButton() {
  const auth = useAtom(authAtom);   // store-scoped under a provider
  return <button onClick={() => auth.logout()}>Log out</button>;
}
```

Without `useAtom(authAtom)`, calling `authAtom.logout()` would mutate the module-level template — fine on the client, wrong on the server.

## Atom for an external library's state

`<atom.Provider>` is useful when an external library hands you state that you want to mirror into an atom.

```tsx
const themeAtom = atom({ key: "theme", default: "light" as "light" | "dark" });

function App({ themeFromOS }) {
  return (
    <themeAtom.Provider value={themeFromOS}>
      <RestOfApp />
    </themeAtom.Provider>
  );
}
```

## Devtools in a React dev build

```ts
// app entry
import { enableAtomDevtools } from "@mongez/atom";

if (process.env.NODE_ENV !== "production") {
  enableAtomDevtools({ name: "MyReactApp" });
}
```

Connects to Redux DevTools — every atom (including `fetchingAtom`s and `portalAtom`s) appears in the timeline.

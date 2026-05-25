---
name: mongez-react-atom-presets
description: Pre-built atom shapes — openAtom (boolean toggle), loadingAtom (loading flag), fetchingAtom (full fetch lifecycle), and portalAtom (modal/drawer coordinator) — and when to reach for each.
when_to_use: User imports or calls openAtom/loadingAtom/fetchingAtom/portalAtom from "@mongez/react-atom", user needs a toggle/open-close atom, user needs a loading flag atom, user needs a fetch-lifecycle atom with isLoading/data/error state, user needs a modal or drawer coordinator atom with open/close/data.
---
# Preset atoms

Four pre-built atom shapes that collapse common patterns to one line.

## `openAtom`

A boolean-shaped toggle with `open`, `close`, `toggle`, and a `useOpened()` hook.

```ts
import { openAtom } from "@mongez/react-atom";

const sidebar = openAtom("sidebar", /* defaultOpened */ false);

// Anywhere:
sidebar.open();
sidebar.close();
sidebar.toggle();

// In components:
function Sidebar() {
  const opened = sidebar.useOpened();
  return opened ? <Drawer /> : null;
}
```

Equivalent to writing:

```ts
const sidebar = atom<boolean, { open(): void; close(): void; toggle(): void; useOpened(): boolean }>({
  key: "sidebar",
  default: false,
  actions: {
    open()   { this.update(true); },
    close()  { this.update(false); },
    toggle() { this.update(!this.value); },
    useOpened() { return (this as any).useValue(); },
  },
});
```

## `loadingAtom`

A boolean with `startLoading` / `stopLoading` / `toggleLoading` verbs.

```ts
import { loadingAtom } from "@mongez/react-atom";

const usersLoading = loadingAtom("usersLoading");

async function fetchUsers() {
  usersLoading.startLoading();
  try {
    const users = await api.users.list();
    setUsers(users);
  } finally {
    usersLoading.stopLoading();
  }
}
```

## `fetchingAtom`

A full fetch lifecycle: `isLoading`, `data`, `error`, optional `pagination`. Comes with `startLoading`, `stopLoading`, `success(data, pagination?)`, `failed(error)`, `append(data)`, `prepend(data)`, plus hooks `useLoading()`, `useData()`, `useError()`, `usePagination()`.

```ts
import { fetchingAtom } from "@mongez/react-atom";

type User = { id: number; name: string };
const usersAtom = fetchingAtom<User[]>("users");

async function loadUsers() {
  usersAtom.startLoading();
  try {
    const { data, pagination } = await api.users.list();
    usersAtom.success(data, pagination);
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

For richer cache management, prefer [`@mongez/atomic-query`](https://github.com/hassanzohdy/mongez-atomic-query). `fetchingAtom` is for one-off fetch flows; `queryAtom.useQuery` is for keyed cache.

## `portalAtom`

A coordinator atom for modals, drawers, tooltips, dropdowns. Holds `{ opened: boolean, data: T }` and exposes `open(data?)`, `close()`, `toggle(data?)`, `useOpened()`, `useData()`.

```ts
import { portalAtom } from "@mongez/react-atom";

type DeleteData = { userId: number; userName: string };
const deleteUserModal = portalAtom<DeleteData>("deleteUserModal");

// Anywhere:
deleteUserModal.open({ userId: 7, userName: "Alice" });

function ConfirmDeleteUser() {
  const opened = deleteUserModal.useOpened();
  const { userId, userName } = deleteUserModal.useData();
  if (!opened) return null;
  return (
    <Dialog>
      <p>Delete {userName}?</p>
      <button onClick={() => deleteUserModal.close()}>Cancel</button>
      <button onClick={async () => { await api.users.remove(userId); deleteUserModal.close(); }}>
        Delete
      </button>
    </Dialog>
  );
}
```

Each `portalAtom` key is suffixed with `-portal` internally, so `portalAtom("deleteUser")` creates an atom whose key is `deleteUser-portal`.

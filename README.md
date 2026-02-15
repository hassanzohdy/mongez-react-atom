# Mongez React Atom

A powerful, React-optimized state management library built on [@mongez/atom](https://github.com/hassanzohdy/atom). Provides React hooks, SSR support, and helper atoms for common patterns.

## Table of Contents

- [Why React Atom?](#why-react-atom)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Core Hooks](#core-hooks)
  - [useValue()](#usevalue)
  - [useState()](#usestate)
  - [use()](#use)
  - [useWatch()](#usewatch)
- [Creating Atoms](#creating-atoms)
- [Helper Atoms](#helper-atoms)
  - [openAtom](#openatom)
  - [loadingAtom](#loadingatom)
  - [fetchingAtom](#fetchingatom)
  - [portalAtom](#portalatom)
- [SSR Support](#ssr-support)
  - [Next.js App Router (13+)](#nextjs-app-router-13)
  - [Next.js Pages Router](#nextjs-pages-router)
  - [Remix](#remix)
- [AtomProvider](#atomprovider)
- [Working with Arrays](#working-with-arrays)
- [Complete API Reference](#complete-api-reference)
- [React 18+ Features](#react-18-features)
- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [Testing Guide](#testing-guide)
- [TypeScript Patterns](#typescript-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Migration Guides](#migration-guides)
- [Real-World Examples](#real-world-examples)
- [Change Log](#change-log)

## Why React Atom?

React Atom extends [@mongez/atom](https://github.com/hassanzohdy/atom) with React-specific features:

- **React Hooks** - `useValue()`, `useState()`, `use()`, `useWatch()`
- **SSR Support** - Works with Next.js, Remix, and other SSR frameworks
- **Helper Atoms** - Pre-built atoms for common patterns (loading, fetching, portals)
- **Zero Boilerplate** - No providers, actions, or reducers needed
- **Type-Safe** - Full TypeScript support with inference
- **Tiny Bundle** - ~3KB gzipped

> **Note**: Make sure to read [@mongez/atom documentation](https://github.com/hassanzohdy/atom) first, as this package is a React adapter.

## Installation

```bash
yarn add @mongez/react-atom
```

Or

```bash
npm i @mongez/react-atom
```

Or

```bash
pnpm add @mongez/react-atom
```

## Quick Start

Get started in 30 seconds:

```tsx
import { atom } from "@mongez/react-atom";

// 1. Create an atom
const counterAtom = atom({
  key: "counter",
  default: 0,
});

// 2. Use in a component
function Counter() {
  const count = counterAtom.useValue();

  return (
    <button onClick={() => counterAtom.update(count + 1)}>
      Count: {count}
    </button>
  );
}
```

That's it! The component re-renders automatically when the atom updates.

## Architecture Overview

### How It Extends @mongez/atom

React Atom is a **thin wrapper** around @mongez/atom that adds React-specific functionality:

```
@mongez/atom (Core)
    ↓
@mongez/react-atom (React Hooks)
```

**What it adds:**

- React hooks (`useValue`, `useState`, `use`, `useWatch`)
- SSR Provider component
- Helper atoms (loading, fetching, portal, open)
- React-specific optimizations

**What it inherits:**

- All core atom methods (`update`, `merge`, `change`, `watch`, etc.)
- Event system
- Atom actions
- Type safety

### Hook-Based API

All React-specific features are exposed as **methods on the atom**:

```tsx
const userAtom = atom({ key: "user", default: {} });

// ✅ Hooks are atom methods
userAtom.useValue();
userAtom.useState();
userAtom.use("name");

// ✅ Core methods still available
userAtom.update(newUser);
userAtom.merge({ name: "John" });
userAtom.onChange(() => {});
```

This design makes atoms **self-contained** - everything you need is on the atom object.

## Core Hooks

### useValue()

Get the atom's value and re-render on changes:

```tsx
function Header() {
  const currency = currencyAtom.useValue();

  return <div>Currency: {currency}</div>;
}
```

**When to use:**

- You only need to **read** the value
- You update the atom from event handlers
- You want the simplest API

### useState()

Get value and updater function (like React's `useState`):

```tsx
function Header() {
  const [currency, setCurrency] = currencyAtom.useState();

  return (
    <>
      <div>Currency: {currency}</div>
      <button onClick={() => setCurrency("USD")}>USD</button>
      <button onClick={() => setCurrency("EUR")}>EUR</button>
    </>
  );
}
```

**When to use:**

- You need both value and updater
- You're familiar with `useState` API
- You want to pass updater to child components

**Difference from useValue:**

- `useValue()` - Returns just the value
- `useState()` - Returns `[value, updater]` tuple

### use()

Watch a **specific property** of an object atom:

```tsx
type User = {
  name: string;
  age: number;
  notifications: number;
};

const userAtom = atom<User>({
  key: "user",
  default: {
    name: "Hasan",
    age: 25,
    notifications: 0,
  },
});

function Header() {
  // Only re-renders when notifications change
  const notifications = userAtom.use("notifications");

  return <div>Notifications: {notifications}</div>;
}
```

**When to use:**

- You only care about **one property**
- You want to **avoid unnecessary re-renders**
- The atom is an object with many properties

**Performance benefit:**

```tsx
// ❌ Re-renders on ANY user change
const user = userAtom.useValue();
return <div>{user.notifications}</div>;

// ✅ Only re-renders when notifications change
const notifications = userAtom.use("notifications");
return <div>{notifications}</div>;
```

### useWatch()

Execute a callback when a property changes:

```tsx
function SomeComponent() {
  const [city, setCity] = useState(userAtom.get("address.city"));

  // Update local state when atom property changes
  userAtom.useWatch("address.city", setCity);

  return <div>Current City: {city}</div>;
}
```

**When to use:**

- You need to **sync** atom changes to local state
- You want to trigger **side effects** on property changes
- You're integrating with non-atom state

**Important**: The callback should be **memoized** (use `useCallback` or pass a setter function directly).

## Creating Atoms

### Basic Atom

```tsx
import { atom } from "@mongez/react-atom";

export const currencyAtom = atom({
  key: "currency",
  default: "EUR",
});
```

### Object Atom

```tsx
type User = {
  name: string;
  email: string;
  age: number;
};

export const userAtom = atom<User>({
  key: "user",
  default: {
    name: "",
    email: "",
    age: 0,
  },
});
```

### Atom with Actions

```tsx
export const counterAtom = atom({
  key: "counter",
  default: 0,
  actions: {
    increment() {
      this.update(this.value + 1);
    },
    decrement() {
      this.update(this.value - 1);
    },
    reset() {
      this.update(0);
    },
  },
});

// Usage
counterAtom.increment();
counterAtom.decrement();
counterAtom.reset();
```

## Helper Atoms

React Atom provides pre-built atoms for common patterns.

### openAtom

Manages open/closed state (modals, dropdowns, etc.):

```tsx
import { openAtom } from "@mongez/react-atom";

export const loginModalAtom = openAtom("loginModal");

// In your modal component
function LoginModal() {
  const isOpen = loginModalAtom.useOpened();

  return (
    <Modal isOpen={isOpen} onClose={loginModalAtom.close}>
      <div>Login Content</div>
    </Modal>
  );
}

// Anywhere in your app
<button onClick={loginModalAtom.open}>Login</button>;
```

**API:**

- `useOpened()` - Hook to get/watch open state
- `open()` - Set to true
- `close()` - Set to false
- `toggle()` - Toggle state

**Default open:**

```tsx
const sidebarAtom = openAtom("sidebar", true); // Open by default
```

### loadingAtom

Manages loading state:

```tsx
import { loadingAtom } from "@mongez/react-atom";

export const postsLoadingAtom = loadingAtom("postsLoading");

function Posts() {
  const isLoading = postsLoadingAtom.useValue();

  useEffect(() => {
    postsLoadingAtom.startLoading();

    fetchPosts()
      .then(() => postsLoadingAtom.stopLoading())
      .catch(() => postsLoadingAtom.stopLoading());
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return <div>Posts...</div>;
}
```

**API:**

- `startLoading()` - Set to true
- `stopLoading()` - Set to false
- `toggleLoading()` - Toggle state
- `useValue()` - Hook to get/watch state

### fetchingAtom

Complete data fetching state management:

```tsx
import { fetchingAtom } from "@mongez/react-atom";

type Post = {
  id: number;
  title: string;
  body: string;
};

export const postsAtom = fetchingAtom<Post[]>("posts");

function Posts() {
  const isLoading = postsAtom.useLoading();
  const posts = postsAtom.useData();
  const error = postsAtom.useError();

  useEffect(() => {
    postsAtom.startLoading();

    fetchPosts()
      .then((response) => {
        postsAtom.success(response.data, response.pagination);
      })
      .catch((error) => {
        postsAtom.failed(error.message);
      });
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {posts?.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**API:**

- `useLoading()` - Hook for loading state
- `useData()` - Hook for data
- `useError()` - Hook for error
- `usePagination()` - Hook for pagination
- `startLoading()` - Start loading
- `stopLoading()` - Stop loading
- `success(data, pagination?)` - Mark as successful
- `failed(error)` - Mark as failed
- `append(data)` - Append to array data
- `prepend(data)` - Prepend to array data

**Pagination support:**

```tsx
postsAtom.success(posts, {
  currentPage: 1,
  totalPages: 10,
  total: 100,
});

const pagination = postsAtom.usePagination();
```

**Infinite scroll:**

```tsx
function loadMore() {
  fetchNextPage().then((newPosts) => {
    postsAtom.append(newPosts);
  });
}
```

### portalAtom

For modals/drawers that need to pass data:

```tsx
import { portalAtom } from "@mongez/react-atom";

type EditUserData = {
  userId: number;
  initialName: string;
};

export const editUserPortal = portalAtom<EditUserData>("editUser");

// Modal component
function EditUserModal() {
  const isOpen = editUserPortal.useOpened();
  const data = editUserPortal.useData();

  return (
    <Modal isOpen={isOpen} onClose={editUserPortal.close}>
      <div>Editing user {data.userId}</div>
      <input defaultValue={data.initialName} />
    </Modal>
  );
}

// Trigger from anywhere
<button
  onClick={() =>
    editUserPortal.open({
      userId: 123,
      initialName: "John",
    })
  }
>
  Edit User
</button>;
```

**API:**

- `useOpened()` - Hook for open state
- `useData()` - Hook for data
- `open(data?)` - Open with optional data
- `close()` - Close
- `toggle(data?)` - Toggle with optional data

## SSR Support

React Atom works seamlessly with SSR frameworks.

### Next.js App Router (13+)

**Important**: Add `"use client"` directive to atom files and components using atoms.

#### Creating Atoms

```tsx
// src/atoms/user-atom.ts
"use client";

import { atom } from "@mongez/react-atom";

type User = {
  name: string;
  email: string;
};

const userAtom = atom<User>({
  key: "user",
  default: {
    name: "",
    email: "",
  },
});

// Export the Provider for SSR
export const UserAtomProvider = userAtom.Provider;

export default userAtom;
```

#### Using in Server Components

```tsx
// app/page.tsx (Server Component)
import { UserAtomProvider } from "@/atoms/user-atom";
import UserProfile from "@/components/UserProfile";

export default async function Page() {
  // Fetch user data on server
  const user = await fetchUser();

  return (
    <UserAtomProvider value={user}>
      <UserProfile />
    </UserAtomProvider>
  );
}
```

#### Using in Client Components

```tsx
// components/UserProfile.tsx
"use client";

import userAtom from "@/atoms/user-atom";

export default function UserProfile() {
  const user = userAtom.useValue();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { UserAtomProvider } from "@/atoms/user-atom";

function MyApp({ Component, pageProps }) {
  return (
    <UserAtomProvider value={pageProps.user}>
      <Component {...pageProps} />
    </UserAtomProvider>
  );
}

export default MyApp;
```

```tsx
// pages/index.tsx
export async function getServerSideProps() {
  const user = await fetchUser();

  return {
    props: {
      user,
    },
  };
}
```

### Remix

```tsx
// routes/index.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { UserAtomProvider } from "@/atoms/user-atom";
import UserProfile from "@/components/UserProfile";

export async function loader() {
  const user = await fetchUser();
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <UserAtomProvider value={user}>
      <UserProfile />
    </UserAtomProvider>
  );
}
```

## AtomProvider

Create scoped atom instances (useful for lists or isolated contexts):

```tsx
import { AtomProvider } from "@mongez/react-atom";
import { userAtom } from "@/atoms";

function UserList() {
  const users = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ];

  return (
    <>
      {users.map((user) => (
        <AtomProvider key={user.id} register={[userAtom]}>
          <UserCard initialData={user} />
        </AtomProvider>
      ))}
    </>
  );
}

function UserCard({ initialData }) {
  const scopedUserAtom = useAtom("user");

  useEffect(() => {
    scopedUserAtom.update(initialData);
  }, []);

  const user = scopedUserAtom.useValue();

  return <div>{user.name}</div>;
}
```

**Multiple atoms:**

```tsx
<AtomProvider register={[userAtom, settingsAtom, themeAtom]}>
  <App />
</AtomProvider>
```

## Working with Arrays

Use `atomCollection` for array-specific methods:

```tsx
import { atomCollection } from "@mongez/react-atom";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const todosAtom = atomCollection<Todo>({
  key: "todos",
  default: [],
});

function TodoList() {
  const todos = todosAtom.useValue();

  const addTodo = (text: string) => {
    todosAtom.push({
      id: Date.now(),
      text,
      done: false,
    });
  };

  const removeTodo = (id: number) => {
    todosAtom.remove((todo) => todo.id === id);
  };

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>
          {todo.text}
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

See [@mongez/atom documentation](https://github.com/hassanzohdy/atom#working-with-arrays) for all array methods.

## Complete API Reference

### Atom Creation

| Function                           | Parameters                             | Returns     | Description             |
| ---------------------------------- | -------------------------------------- | ----------- | ----------------------- |
| `atom<Value, Actions>()`           | `AtomOptions`                          | `ReactAtom` | Creates a React atom    |
| `atomCollection<Value>()`          | `CollectionOptions`                    | `ReactAtom` | Creates array atom      |
| `openAtom()`                       | `key, defaultOpen?`                    | `ReactAtom` | Creates open/close atom |
| `loadingAtom()`                    | `key, defaultLoading?`                 | `ReactAtom` | Creates loading atom    |
| `fetchingAtom<Data, Pagination>()` | `key, defaultValue?, defaultFetching?` | `ReactAtom` | Creates fetching atom   |
| `portalAtom<Data>()`               | `key, defaultOpen?`                    | `ReactAtom` | Creates portal atom     |

### React Hooks (on atom instance)

| Hook                      | Returns                    | Description                               |
| ------------------------- | -------------------------- | ----------------------------------------- |
| `useValue()`              | `Value`                    | Get value and re-render on changes        |
| `useState()`              | `[Value, (value) => void]` | Get value and updater                     |
| `use<K>(key)`             | `Value[K]`                 | Get property and re-render on its changes |
| `useWatch(key, callback)` | `void`                     | Execute callback on property change       |

### SSR Components

| Component       | Props                               | Description           |
| --------------- | ----------------------------------- | --------------------- |
| `atom.Provider` | `value, children`                   | SSR provider for atom |
| `AtomProvider`  | `register, defaultValue?, children` | Scoped atom provider  |

### Context Hooks

| Hook              | Parameters    | Returns        | Description                       |
| ----------------- | ------------- | -------------- | --------------------------------- |
| `useAtom<T>(key)` | `key: string` | `ReactAtom<T>` | Get scoped atom from AtomProvider |

### Helper Atom APIs

#### openAtom

| Method/Hook   | Returns   | Description          |
| ------------- | --------- | -------------------- |
| `useOpened()` | `boolean` | Get/watch open state |
| `open()`      | `void`    | Set to true          |
| `close()`     | `void`    | Set to false         |
| `toggle()`    | `void`    | Toggle state         |

#### loadingAtom

| Method/Hook       | Returns   | Description             |
| ----------------- | --------- | ----------------------- |
| `useValue()`      | `boolean` | Get/watch loading state |
| `startLoading()`  | `void`    | Set to true             |
| `stopLoading()`   | `void`    | Set to false            |
| `toggleLoading()` | `void`    | Toggle state            |

#### fetchingAtom

| Method/Hook                  | Returns                   | Description          |
| ---------------------------- | ------------------------- | -------------------- |
| `useLoading()`               | `boolean`                 | Get/watch loading    |
| `useData()`                  | `Data \| null`            | Get/watch data       |
| `useError()`                 | `any`                     | Get/watch error      |
| `usePagination()`            | `Pagination \| undefined` | Get/watch pagination |
| `startLoading()`             | `void`                    | Start loading        |
| `stopLoading()`              | `void`                    | Stop loading         |
| `success(data, pagination?)` | `void`                    | Mark successful      |
| `failed(error)`              | `void`                    | Mark failed          |
| `append(data)`               | `void`                    | Append to array      |
| `prepend(data)`              | `void`                    | Prepend to array     |

#### portalAtom

| Method/Hook     | Returns   | Description          |
| --------------- | --------- | -------------------- |
| `useOpened()`   | `boolean` | Get/watch open state |
| `useData()`     | `Data`    | Get/watch data       |
| `open(data?)`   | `void`    | Open with data       |
| `close()`       | `void`    | Close                |
| `toggle(data?)` | `void`    | Toggle with data     |

## React 18+ Features

### Concurrent Mode

Atoms work seamlessly with React 18's Concurrent Mode:

```tsx
function UserProfile() {
  const user = userAtom.useValue();

  // Concurrent rendering works automatically
  return <div>{user.name}</div>;
}
```

### useTransition

Defer atom updates to keep UI responsive:

```tsx
function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const results = searchResultsAtom.useValue();

  const handleSearch = (query: string) => {
    startTransition(() => {
      // This update won't block the UI
      searchResultsAtom.update(performSearch(query));
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <div>Searching...</div>}
      <Results data={results} />
    </div>
  );
}
```

### useDeferredValue

Defer expensive re-renders:

```tsx
function FilteredList() {
  const items = itemsAtom.useValue();
  const filter = filterAtom.useValue();

  // Defer filtering to keep input responsive
  const deferredFilter = useDeferredValue(filter);

  const filtered = useMemo(
    () => items.filter((item) => item.includes(deferredFilter)),
    [items, deferredFilter],
  );

  return <List items={filtered} />;
}
```

### Suspense Integration

Wrap async atom updates with Suspense:

```tsx
const userAtom = atom({
  key: "user",
  default: null,
  actions: {
    async load(userId: string) {
      const user = await fetchUser(userId);
      this.update(user);
    },
  },
});

function UserProfile({ userId }) {
  const user = userAtom.useValue();

  useEffect(() => {
    userAtom.load(userId);
  }, [userId]);

  if (!user) throw new Promise(() => {}); // Trigger Suspense

  return <div>{user.name}</div>;
}

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <UserProfile userId="123" />
</Suspense>;
```

## Advanced Patterns

### Optimistic Updates

Update UI immediately, rollback on error:

```tsx
const todosAtom = atomCollection<Todo>({ key: "todos", default: [] });

async function addTodo(text: string) {
  const optimisticTodo = {
    id: Date.now(),
    text,
    done: false,
  };

  // Optimistic update
  todosAtom.push(optimisticTodo);

  try {
    const savedTodo = await api.createTodo(text);
    // Replace optimistic with real
    todosAtom.replace(
      todosAtom.index((t) => t.id === optimisticTodo.id),
      savedTodo,
    );
  } catch (error) {
    // Rollback on error
    todosAtom.remove((t) => t.id === optimisticTodo.id);
    alert("Failed to create todo");
  }
}
```

### Derived State

Create atoms that derive from others:

```tsx
const firstNameAtom = atom({ key: "firstName", default: "John" });
const lastNameAtom = atom({ key: "lastName", default: "Doe" });

const fullNameAtom = atom({ key: "fullName", default: "" });

// Sync derived state
function useSyncFullName() {
  const firstName = firstNameAtom.useValue();
  const lastName = lastNameAtom.useValue();

  useEffect(() => {
    fullNameAtom.silentUpdate(`${firstName} ${lastName}`);
  }, [firstName, lastName]);
}

// Use in component
function App() {
  useSyncFullName();
  const fullName = fullNameAtom.useValue();

  return <div>{fullName}</div>;
}
```

### Atom Selectors

Select and transform atom data:

```tsx
const usersAtom = atomCollection<User>({ key: "users", default: [] });

function useActiveUsers() {
  const users = usersAtom.useValue();
  return useMemo(() => users.filter((user) => user.active), [users]);
}

function useUserById(id: number) {
  const users = usersAtom.useValue();
  return useMemo(() => users.find((user) => user.id === id), [users, id]);
}
```

### Request Deduplication

Prevent duplicate API calls:

```tsx
const requestCache = new Map<string, Promise<any>>();

const userAtom = atom({
  key: "user",
  default: null,
  actions: {
    async load(userId: string) {
      const cacheKey = `user:${userId}`;

      if (!requestCache.has(cacheKey)) {
        requestCache.set(
          cacheKey,
          fetchUser(userId).finally(() => {
            requestCache.delete(cacheKey);
          }),
        );
      }

      const user = await requestCache.get(cacheKey);
      this.update(user);
    },
  },
});
```

### Infinite Scroll

Implement infinite scroll with fetchingAtom:

```tsx
const postsAtom = fetchingAtom<Post[]>("posts", []);

function InfinitePostList() {
  const posts = postsAtom.useData();
  const isLoading = postsAtom.useLoading();
  const pagination = postsAtom.usePagination();

  const loadMore = async () => {
    if (isLoading || !pagination?.hasMore) return;

    postsAtom.startLoading();

    try {
      const { data, pagination: newPagination } = await fetchPosts(
        pagination.currentPage + 1,
      );

      postsAtom.append(data);
      postsAtom.merge({ pagination: newPagination });
    } catch (error) {
      postsAtom.failed(error);
    }
  };

  return (
    <div>
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {pagination?.hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

## Performance Optimization

### Preventing Unnecessary Re-renders

**1. Use `.use()` for specific properties:**

```tsx
// ❌ Re-renders on ANY user change
function Header() {
  const user = userAtom.useValue();
  return <div>{user.notifications}</div>;
}

// ✅ Only re-renders on notifications change
function Header() {
  const notifications = userAtom.use("notifications");
  return <div>{notifications}</div>;
}
```

**2. Split atoms by concern:**

```tsx
// ❌ One large atom
const appAtom = atom({
  key: "app",
  default: {
    user: {},
    theme: "light",
    language: "en",
    notifications: [],
  },
});

// ✅ Separate atoms
const userAtom = atom({ key: "user", default: {} });
const themeAtom = atom({ key: "theme", default: "light" });
const languageAtom = atom({ key: "language", default: "en" });
const notificationsAtom = atomCollection({ key: "notifications", default: [] });
```

**3. Separate triggering from listening:**

```tsx
// ❌ Component triggers AND listens
function Posts() {
  const posts = postsAtom.useData();

  useEffect(() => {
    postsAtom.startLoading();
    fetchPosts().then((data) => postsAtom.success(data));
  }, []);

  return <div>{posts?.map(...)}</div>;
}

// ✅ Separate components
function PostsLoader() {
  useEffect(() => {
    postsAtom.startLoading();
    fetchPosts().then((data) => postsAtom.success(data));
  }, []);

  return null; // Doesn't re-render
}

function PostsList() {
  const posts = postsAtom.useData();
  return <div>{posts?.map(...)}</div>;
}

function Posts() {
  return (
    <>
      <PostsLoader />
      <PostsList />
    </>
  );
}
```

### Memoization

**Memoize expensive computations:**

```tsx
function FilteredList() {
  const items = itemsAtom.useValue();
  const filter = filterAtom.useValue();

  const filtered = useMemo(
    () => items.filter((item) => item.name.includes(filter)),
    [items, filter],
  );

  return <List items={filtered} />;
}
```

**Memoize components:**

```tsx
const PostCard = memo(function PostCard({ post }: { post: Post }) {
  return <div>{post.title}</div>;
});

function PostsList() {
  const posts = postsAtom.useData();

  return (
    <div>
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Code Splitting

Split atoms by route:

```tsx
// routes/posts/atoms.ts
export const postsAtom = fetchingAtom<Post[]>("posts");

// routes/users/atoms.ts
export const usersAtom = fetchingAtom<User[]>("users");

// Only load atoms when route is accessed
const PostsPage = lazy(() => import("./routes/posts/PostsPage"));
const UsersPage = lazy(() => import("./routes/users/UsersPage"));
```

## Testing Guide

### Unit Testing Atoms

```tsx
import { createAtom } from "@mongez/atom";

describe("counterAtom", () => {
  let counterAtom;

  beforeEach(() => {
    counterAtom = createAtom({
      key: "counter-test",
      default: 0,
    });
  });

  afterEach(() => {
    counterAtom.destroy();
  });

  it("should have default value", () => {
    expect(counterAtom.value).toBe(0);
  });

  it("should update value", () => {
    counterAtom.update(5);
    expect(counterAtom.value).toBe(5);
  });

  it("should notify listeners", () => {
    const listener = jest.fn();
    counterAtom.onChange(listener);

    counterAtom.update(10);

    expect(listener).toHaveBeenCalledWith(10, 0, counterAtom);
  });
});
```

### Testing Components with Atoms

**Using React Testing Library:**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { atom } from "@mongez/react-atom";
import Counter from "./Counter";

const counterAtom = atom({ key: "counter-test", default: 0 });

describe("Counter", () => {
  beforeEach(() => {
    counterAtom.reset();
  });

  afterEach(() => {
    counterAtom.destroy();
  });

  it("should display count", () => {
    render(<Counter />);
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
  });

  it("should increment on click", () => {
    render(<Counter />);

    fireEvent.click(screen.getByText("Increment"));

    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });
});
```

### Mocking Atoms

```tsx
// __mocks__/atoms.ts
import { atom } from "@mongez/react-atom";

export const userAtom = atom({
  key: "user-mock",
  default: {
    id: 1,
    name: "Test User",
    email: "test@example.com",
  },
});

// test file
jest.mock("@/atoms", () => require("./__mocks__/atoms"));

test("renders user name", () => {
  render(<UserProfile />);
  expect(screen.getByText("Test User")).toBeInTheDocument();
});
```

### Integration Testing

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { postsAtom } from "@/atoms";
import PostsList from "./PostsList";

describe("PostsList Integration", () => {
  beforeEach(() => {
    postsAtom.reset();
  });

  it("should load and display posts", async () => {
    render(<PostsList />);

    // Should show loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText("Post 1")).toBeInTheDocument();
    });

    // Should hide loading
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
```

## TypeScript Patterns

### Type-Safe Atoms

```tsx
type User = {
  id: number;
  name: string;
  email: string;
};

const userAtom = atom<User>({
  key: "user",
  default: {
    id: 0,
    name: "",
    email: "",
  },
});

// Full type safety
const name = userAtom.use("name"); // string
const id = userAtom.use("id"); // number
userAtom.change("email", "test@example.com"); // ✅
userAtom.change("email", 123); // ❌ Type error
```

### Generic Helper Atoms

```tsx
function createEntityAtom<T extends { id: number }>(
  key: string,
  defaultValue: T,
) {
  return atom<T>({
    key,
    default: defaultValue,
    actions: {
      updateById(id: number, updates: Partial<T>) {
        if (this.value.id === id) {
          this.merge(updates);
        }
      },
    },
  });
}

// Usage
const userAtom = createEntityAtom("user", {
  id: 1,
  name: "John",
  email: "john@example.com",
});

userAtom.updateById(1, { name: "Jane" }); // ✅ Type-safe
```

### Discriminated Unions

```tsx
type LoadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: string };

const userLoadingAtom = atom<LoadingState>({
  key: "userLoading",
  default: { status: "idle" },
});

function UserProfile() {
  const state = userLoadingAtom.useValue();

  switch (state.status) {
    case "idle":
      return <div>Click to load</div>;
    case "loading":
      return <div>Loading...</div>;
    case "success":
      return <div>{state.data.name}</div>; // Type-safe!
    case "error":
      return <div>Error: {state.error}</div>;
  }
}
```

## Best Practices

### 1. Separate Triggering from Listening

```tsx
// ✅ Good: Separate concerns
function PostsLoader() {
  useEffect(() => {
    postsAtom.startLoading();
    fetchPosts().then((data) => postsAtom.success(data));
  }, []);
  return null;
}

function PostsList() {
  const posts = postsAtom.useData();
  return <div>{posts?.map(...)}</div>;
}
```

### 2. Use Specific Hooks

```tsx
// ❌ Bad: Re-renders on any user change
const user = userAtom.useValue();
return <div>{user.notifications}</div>;

// ✅ Good: Only re-renders on notifications change
const notifications = userAtom.use("notifications");
return <div>{notifications}</div>;
```

### 3. Clean Up Subscriptions

```tsx
// ✅ Hooks handle cleanup automatically
userAtom.useValue(); // Auto-cleanup on unmount

// ❌ Manual subscriptions need cleanup
useEffect(() => {
  const sub = userAtom.onChange(() => {});
  return () => sub.unsubscribe(); // Don't forget!
}, []);
```

### 4. Use Helper Atoms

```tsx
// ❌ Bad: Manual state management
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// ✅ Good: Use fetchingAtom
const dataAtom = fetchingAtom("data");
const isLoading = dataAtom.useLoading();
const data = dataAtom.useData();
const error = dataAtom.useError();
```

### 5. Type Your Atoms

```tsx
// ❌ Bad: No types
const userAtom = atom({
  key: "user",
  default: {},
});

// ✅ Good: Explicit types
type User = { id: number; name: string };
const userAtom = atom<User>({
  key: "user",
  default: { id: 0, name: "" },
});
```

## Troubleshooting

### Component Not Re-rendering

**Problem**: Updating atom but component doesn't re-render.

**Solutions:**

1. **Use a hook:**

```tsx
// ❌ Doesn't re-render
const value = atom.value;

// ✅ Re-renders
const value = atom.useValue();
```

2. **Pass new reference for objects:**

```tsx
// ❌ Same reference
atom.update(atom.value);

// ✅ New reference
atom.update({ ...atom.value });
```

### SSR Hydration Mismatch

**Problem**: "Hydration failed" error in Next.js.

**Solution**: Use atom Provider:

```tsx
// ❌ Bad
function Page() {
  const user = userAtom.useValue();
  return <div>{user.name}</div>;
}

// ✅ Good
export default function Page() {
  const user = await fetchUser();

  return (
    <UserAtomProvider value={user}>
      <UserProfile />
    </UserAtomProvider>
  );
}
```

### "use client" Directive Missing

**Problem**: Error in Next.js App Router.

**Solution**: Add "use client" to atom files and components:

```tsx
"use client"; // Add this!

import { atom } from "@mongez/react-atom";

export const userAtom = atom({ ... });
```

### Memory Leaks

**Problem**: App slows down over time.

**Solution**: Hooks auto-cleanup, but manual subscriptions need cleanup:

```tsx
// ✅ Auto-cleanup
userAtom.useValue();

// ❌ Manual cleanup needed
useEffect(() => {
  const sub = userAtom.onChange(() => {});
  return () => sub.unsubscribe(); // Don't forget!
}, []);
```

## Migration Guides

### From Redux + React-Redux

**Redux:**

```tsx
// store.ts
const initialState = { user: null };

function userReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_USER":
      return { user: action.payload };
    default:
      return state;
  }
}

// component
const user = useSelector((state) => state.user);
dispatch({ type: "SET_USER", payload: newUser });
```

**React Atom:**

```tsx
// atoms.ts
const userAtom = atom({
  key: "user",
  default: null,
});

// component
const user = userAtom.useValue();
userAtom.update(newUser);
```

**Migration steps:**

1. Replace reducers with atoms
2. Replace `useSelector` with `atom.useValue()`
3. Replace `dispatch` with `atom.update()`
4. Remove Redux provider

### From Zustand

**Zustand:**

```tsx
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const count = useStore((state) => state.count);
const increment = useStore((state) => state.increment);
```

**React Atom:**

```tsx
const counterAtom = atom({
  key: "counter",
  default: 0,
  actions: {
    increment() {
      this.update(this.value + 1);
    },
  },
});

const count = counterAtom.useValue();
counterAtom.increment();
```

**Migration steps:**

1. Convert stores to atoms
2. Move actions to atom actions
3. Replace `useStore` with atom hooks

### From Jotai

**Jotai:**

```tsx
const countAtom = atom(0);

const [count, setCount] = useAtom(countAtom);
```

**React Atom:**

```tsx
const counterAtom = atom({
  key: "counter",
  default: 0,
});

const [count, setCount] = counterAtom.useState();
```

**Migration steps:**

1. Add `key` to atoms
2. Replace `useAtom` with `atom.useState()`
3. Atoms work outside React (bonus!)

### From Context API

**Context:**

```tsx
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Child />
    </UserContext.Provider>
  );
}

function Child() {
  const { user } = useContext(UserContext);
  return <div>{user?.name}</div>;
}
```

**React Atom:**

```tsx
const userAtom = atom({
  key: "user",
  default: null,
});

function App() {
  return <Child />;
}

function Child() {
  const user = userAtom.useValue();
  return <div>{user?.name}</div>;
}
```

**Benefits:**

- No provider needed
- Works outside components
- Better performance

## Real-World Examples

### Shopping Cart

```tsx
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

const cartAtom = atomCollection<CartItem>({
  key: "cart",
  default: [],
  actions: {
    addItem(item: Omit<CartItem, "quantity">) {
      const existing = this.get((i) => i.id === item.id);

      if (existing) {
        this.replace(
          this.index((i) => i.id === item.id),
          { ...existing, quantity: existing.quantity + 1 },
        );
      } else {
        this.push({ ...item, quantity: 1 });
      }
    },
    removeItem(id: number) {
      this.remove((item) => item.id === id);
    },
    updateQuantity(id: number, quantity: number) {
      const index = this.index((i) => i.id === id);
      const item = this.get(index);

      if (quantity === 0) {
        this.remove(index);
      } else {
        this.replace(index, { ...item, quantity });
      }
    },
    clear() {
      this.update([]);
    },
    get total() {
      return this.value.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },
  },
});

function Cart() {
  const items = cartAtom.useValue();
  const total = useMemo(() => cartAtom.total, [items]);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          {item.name} - ${item.price} x {item.quantity}
          <button onClick={() => cartAtom.removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <div>Total: ${total}</div>
    </div>
  );
}
```

### Authentication Flow

```tsx
type User = {
  id: number;
  name: string;
  email: string;
  token: string;
};

const authAtom = atom<User | null>({
  key: "auth",
  default: null,
  actions: {
    async login(email: string, password: string) {
      try {
        const user = await api.login(email, password);
        this.update(user);
        localStorage.setItem("token", user.token);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    logout() {
      this.update(null);
      localStorage.removeItem("token");
    },
    async loadFromStorage() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const user = await api.verifyToken(token);
          this.update(user);
        } catch {
          this.logout();
        }
      }
    },
  },
});

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await authAtom.login(email, password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}

function App() {
  useEffect(() => {
    authAtom.loadFromStorage();
  }, []);

  const user = authAtom.useValue();

  if (!user) return <LoginForm />;

  return <Dashboard />;
}
```

### Multi-Step Wizard

```tsx
type WizardStep = "personal" | "address" | "payment" | "review";

type WizardData = {
  personal: { name: string; email: string };
  address: { street: string; city: string };
  payment: { cardNumber: string };
};

const wizardAtom = atom<{
  currentStep: WizardStep;
  data: Partial<WizardData>;
}>({
  key: "wizard",
  default: {
    currentStep: "personal",
    data: {},
  },
  actions: {
    nextStep() {
      const steps: WizardStep[] = ["personal", "address", "payment", "review"];
      const currentIndex = steps.indexOf(this.value.currentStep);

      if (currentIndex < steps.length - 1) {
        this.change("currentStep", steps[currentIndex + 1]);
      }
    },
    prevStep() {
      const steps: WizardStep[] = ["personal", "address", "payment", "review"];
      const currentIndex = steps.indexOf(this.value.currentStep);

      if (currentIndex > 0) {
        this.change("currentStep", steps[currentIndex - 1]);
      }
    },
    updateData<K extends keyof WizardData>(step: K, data: WizardData[K]) {
      this.merge({
        data: {
          ...this.value.data,
          [step]: data,
        },
      });
    },
    reset() {
      this.update(this.defaultValue);
    },
  },
});

function Wizard() {
  const currentStep = wizardAtom.use("currentStep");

  return (
    <div>
      {currentStep === "personal" && <PersonalStep />}
      {currentStep === "address" && <AddressStep />}
      {currentStep === "payment" && <PaymentStep />}
      {currentStep === "review" && <ReviewStep />}
    </div>
  );
}
```

## Change Log

- **V5.1.0** (Added Portal Atom)
  - Added `portalAtom` helper
- **V5.0.0** (12 May 2024)
  - React Atom now depends on [@mongez/atom](https://github.com/hassanzohdy/atom)
  - Refactored `openAtom`, `loadingAtom`, and `fetchingAtom` to use Atom Actions
  - Enhanced documentation
- **V4.0.0** (10 Sept 2023)
  - Added `register` prop to `AtomProvider`
  - Removed `useWatcher` hook
  - `use` now accepts only the key
- **V3.2.0** (31 Aug 2023)
  - Enhanced Atom Provider for clone
- **V3.1.0** (24 Jun 2023)
  - Added `openAtom`, `loadingAtom`, and `fetchingAtom`
- **V3.0.0** (25 May 2023)
  - Added SSR support
- **V2.1.0** (21 Mar 2023)
  - Added `merge` method
  - Enhanced `update` typings
- **V2.0.0** (18 Dec 2022)
  - Removed legacy hooks
  - Added `useState` hook
  - Enhanced atom typings

# Mongez React Atom

A powerful state management tool for React Js.

This is a React Js adapter built on [Mongez Atom](https://github.com/hassanzohdy/atom).

> Make sure to read Mongez Atom documentation first before using this package as this package is an adapter for React Js.

## Installation

`yarn add @mongez/react-atom`

Or

`npm i @mongez/react-atom`

Or

`pnpm add @mongez/react-atom`

## Using Atoms outside components

Atoms can be accessed outside components, this is useful when you want to use the atom's value in a function or a class, or even in a service.

By embracing the idea using atoms outside components, we can easily manage the data in a single place, this can help you update or fetch the current atom's value while you're not using it inside a component.

## Creating New Atom

The main idea here is every single data that might be manipulated will be stored independently in a shape of an `atom`.

This will raise the power of single responsibility.

```ts
import { atom } from "@mongez/react-atom";

export const currencyAtom = atom({
  key: "currency",
  default: "EUR",
});
```

> Please note that all atoms are immutables, the default data will be kept untouched if it is an object or an array.

When creating a new atom, it's recommended to pass the atom's value type as a generic type to the `atom` function, this will help you use the atom's value in a type-safe way.

## Using Atoms in components

Now the `currencyAtom` atom has only single value, from this point we can use it in anywhere in our application components or event outside components.

`Header.tsx`

```tsx
import React from "react";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  // get current currency value and re-render the component when currency is changed
  const currency = currencyAtom.useValue();

  return (
    <>
      <h1>Header</h1>
      Currency: {currency}
    </>
  );
}
```

`Footer.tsx`

```tsx
import React from "react";
import { useAtom } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Footer() {
  const currency = currencyAtom.useValue();

  return (
    <>
      <h1>Footer</h1>
      You're using our application in {currency} Currency.
    </>
  );
}
```

In our Header component we just display the current value of the currency, which is the default value in our atom `EUR`.

In the `Footer` component, we also displayed the current currency in a form of a message.

Now let's add some buttons to change the current currency from the header.

`Header.tsx`

```tsx
import { useAtom } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  return (
    <>
      <h1>Header</h1>
      <button onClick={() => currencyAtom.update("EUR")}>EUR</button>
      <button onClick={() => currencyAtom.update("USD")}>USD</button>
      <button onClick={() => currencyAtom.update("EGP")}>EGP</button>
    </>
  );
}
```

Once we click on any button of the three buttons, the currency will be changed in our atom, this will re-render the `Header` once the currency is changed.

## Get atom value

Atom's value can be fetched in different ways, depends what are you trying to do.

For example, if you're using the atom outside a `React component` or you're using it inside a component but don't want to rerender the component when the atom's value changes, you can use the `atom.value` property.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

console.log(currencyAtom.value); // get current value
```

## Getting atom value and watch for its changes

Another way to get the atom's value when you're inside a React component, we can use `atom.useValue()` to get the atom's value and also trigger a component rerender when the atom's value changes.

```tsx
import React from "react";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const currency = currencyAtom.useValue();

  return (
    <>
      <h1>Header</h1>
      Currency: {currency}
    </>
  );
}
```

## Get atom value and update it

If you want to get the atom's value and update it at the same time, you can use `atom.useState()`.

```tsx
import React from "react";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const [currency, setCurrency] = currencyAtom.useState();

  return (
    <>
      <h1>Header</h1>
      Currency: {currency}
      <button onClick={(e) => setCurrency("EUR")}>EUR</button>
      <button onClick={(e) => setCurrency("USD")}>USD</button>
      <button onClick={(e) => setCurrency("EGP")}>EGP</button>
    </>
  );
}
```

Works exactly like `useState` hook, the first item in the returned array is the current value of the atom, the second item is a state updater for the atom's value.

The main difference here is when the atom's value is changed from any other place, this component will be rerendered automatically.

## Use

the `atom.use()` hook receives a key of the atom's object, it returns the current value and also watch for that key changes, this will re-render the component when the key is changed.

This is a recommended way to not make any useless renders in your components if other keys in the atom object is changed, we need to watch only for the key we're interested in.

```tsx
type User = {
  name: string;
  age: number;
  position: "developer" | "designer" | "manager";
  notifications: number;
};

const userAtom = atom<User>({
  key: "user",
  default: {
    name: "Hasan",
    age: 25,
    position: "developer",
  },
});

// now in any component
import userAtom from "./userAtom";
export function Header() {
  const notifications = userAtom.use("notifications");

  return <header>{notifications}</header>;
}
```

This will only re-render the component when the `notifications` property changes.

## Changing only single key in the atom's value

Instead of passing the whole object to the `setUser` function, we can pass only the key we want to change using `atom.change` function.

```tsx
import React from "react";
import { userAtom } from "~/src/atoms";

export default function UserForm() {
  const [user, setUser] = userAtom.useState();

  return (
    <>
      <h1>User Form</h1>
      <input
        type="text"
        value={user.name}
        onChange={(e) => userAtom.change("name", e.target.value)}
      />
      <input
        type="text"
        value={user.email}
        onChange={(e) => userAtom.change("email", e.target.value)}
      />
    </>
  );
}
```

> It's recommended to use one of the atom update methods `update, change, merge` to update the atom's value, this will be a slightly better performance than using `useState` hook.

This will change only the given key in the atom's value, and trigger a component rerender if the atom's value is used in the component.

> Please note that `change` method calls `update` method under the hood, so it will generate a new object.

## Atom Watch Hook

In some scenarios, we may need to watch for a key in the atom's value object for change and perform an action inside a component, the `atom.useWatch` hook is the perfect way to achieve this.

```tsx
export function SomeComponent() {
  const [city, setCity] = useState(userAtom.get("address.city"));

  userAtom.useWatch("address.city", setCity);

  // first time will render New York then it will render Cairo

  return <>Current City: {city}</>;
}
```

> Please make sure that the callback function is a memoized function, this will prevent the function from being recreated on each render, you can pass the set state function or wrap your custom const callback function with `useCallback` hook.

## AtomProvider

Atom Provider allows you to use same atom in a scoped version, this is useful when you want to deal with an atom inside an array of objects, or using the same atom in multiple components in the same page but each atom handles different data.

Wrap the code that you want to use the atom inside it with `AtomProvider`, and pass the to the `register` prop

```tsx
import { AtomProvider } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function MyComponent() {
  return (
    <AtomProvider register={[currencyAtom]}>
      <ChildComponent />
    </AtomProvider>
  );
}
```

Now to access any atom from any component wrapped inside `AtomProvider` component, you need to use `useAtom` hook.

```tsx
import { useAtom } from "@mongez/react-atom";

export default function Page() {
  const userAtom = useAtom("currency");

  return (
    <div>
      <div>Value: {value}</div>
      <button onClick={() => userAtom.change("name", "New Value")}>
        Change Value
      </button>
    </div>
  );
}
```

The main difference here you get a `copy` of the atom by calling `useAtom`, this will ensure that data are separated from the original atom, you get a new copy of the atom.

You may also register multiple atoms at once.

```tsx
import { AtomProvider } from "@mongez/react-atom";
import currentAtom from "./currentAtom";
import userAtom from "./userAtom";

export default function App() {
  return (
    <AtomProvider register={[currentAtom, userAtom]}>
      <App />
    </AtomProvider>
  );
}
```

Because atoms are auto registered when the atom's file is being imported `(when declaring an atom)`, this happens when the atom is being imported, but now we are using `useAtom` instead of the atom itself, thus we need to register the atom as well.

The argument passed to the `useAtom` hook is the atom name.

## SSR Support

Now atoms can lay in SSR environments like Nextjs, Remix, etc, but with a little bit of change.

To make sure that the atom's value is being updated in both client and server, we need to create a special atom provider from the atom itself.

```tsx
// it is important to add the `usa client` directive
"use client";
// src/atoms/user-atom.ts
import { atom } from "@mongez/react-atom";

type User = {
  name: string;
  email: string;
  age: number;
  id: number;
};

const userAtom = atom<User>({
  key: "user",
  default: {},
});

// very important is to create the UserAtomProvider
export const UserAtomProvider = userAtom.Provider;
```

We can not directly use `userAtom.Provider` in Nextjs as it will throw an error of not identifying it, so we need to export it in a separate const `UserAtomProvider`.

> Any component that uses the atom must declare `use client` directive at the top of the file because atoms uses React useState hook under the hood, and this hook is not available in the server side.

```tsx
// src/app/page.tsx
import { UserAtomProvider } from "~/atoms/user-atom";

export default function Page() {
  const userFromCookies = {};

  return (
    <UserAtomProvider value={userFromCookies}>
      <OtherComponentsListHere />
    </UserAtomProvider>
  );
}
```

Now you can use the `userAtom` as usual in any component, it will be updated in both client and server.

## Helper Atoms

Helper atoms functions allow you to easily manage `variant` atoms that you would probably use in your app.

### Portal Atom

> Added in V5.1.0

The portal atom is mainly used when working with modals, drawers or any other component that requires a state management and data transfer from a component to any other component that is not in the same component.

```tsx
import { portalAtom } from "@mongez/react-atom";

export const loginPortal = portalAtom("loginPopup");
```

Now let's declare the `LoginPopup` component.

`LoginPopup.tsx`

```tsx
import { loginPortal } from "./atoms";

export default function LoginPopup() {
  const opened = loginPortal.useOpened();

  return (
    <Modal isOpen={opened} onClose={loginPortal.close}>
      <div>Login Content Here</div>
    </Modal>
  );
}
```

Import the `LoginPopup` in the layout component or any shared component across the app.

`Layout.tsx`

```tsx
import LoginPopup from "./LoginPopup";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoginPopup />
      {children}
    </>
  );
}
```

From any component, you can open the login popup using `loginPortal.open()` function, let's open it from the header component.

`Header.tsx`

```tsx
import { loginPortal } from "./atoms";

export default function Header() {
  return <button onClick={loginPortal.open}>Login</button>;
}
```

### Open Atom

The `openAtom` function is mainly used to manage an open state, this one is useful when working with modals, popups, etc.

```tsx
import { openAtom } from "@mongez/react-atom";

export const loginPopupAtom = openAtom("openAtom");
```

This atom exposes 4 actions

- `useOpened`: a hook to get and watch for the `opened` value.
- `open`: a function that sets the `opened` value to `true`.
- `close`: a function that sets the `opened` value to `false`.
- `toggle`: a function that toggles the `opened` value.

By default, `opened` is set to `false`, if you want to set it to `true` by default, pass `true` as the second argument to `booleanAtom` function.

```tsx
import { openAtom } from "@mongez/react-atom";

export const loginPopupAtom = openAtom("loginPopup", true);
```

Let's see an example of usage

`LoginPopup.tsx`

```tsx
import { loginPopupAtom } from "./atoms";

export default function LoginPopup() {
  const opened = loginPopupAtom.useOpened(); // watch for opened when it is changed

  return (
    <Modal isOpen={opened} onClose={loginPopupAtom.close}>
      <div>Login Content Here</div>
    </Modal>
  );
}
```

Using `open` action to open the popup:

`Header.tsx`

```tsx
import { loginPopupAtom } from "./atoms";

export default function Header() {
  return (
    <div>
      <button onClick={loginPopupAtom.open}>Login</button>
    </div>
  );
}
```

This applies to `close` and `toggle` functions as well.

### Loading Atom

Another good helper function is `loadingAtom` which is used to manage a loading state, this is useful when you want to show a loading indicator when a request is being made.

It has 3 actions:

- `startLoading`: a function that sets the atom value to `true`.
- `stopLoading`: a function that sets the atom value to `false`.
- `toggleLoading`: a function that toggles the atom value.

By default, atom value is set to `false`, if you want to set it to `true` by default, pass `true` as the second argument to `loadingAtom` function.

```tsx
import { loadingAtom } from "@mongez/react-atom";

export const loadingPostsAtom = loadingAtom("loadingPosts", true);
```

Let's see an example of usage

`Posts.tsx`

```tsx
import { loadingPostsAtom } from "./atoms";
import { useEffect, useState } from "react";
import { loadPosts } from "./api";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const isLoading = loadingPostsAtom.useValue(); // watch for isLoading when it is changed

  useEffect(() => {
    loadingPostsAtom.startLoading();
    loadPosts().then((response) => {
      loadingPostsAtom.stopLoading();
      setPosts(response.data.posts);
    });
  }, []);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {posts.map((post) => (
        <div>{post.title}</div>
      ))}
    </div>
  );
}
```

> The `loadingAtom` has same functions as `openAtom`, but instead of `open`, `close` and `toggle`, it has `startLoading`, `stopLoading` and `toggleLoading`.

### Fetching Atom

This helper atom is quiet good actually, it allows you to manage an API fetching, consider it a full atom that manages the loading state, the data, and the error.

It exposes `8` actions:

- `useLoading`: a hook to get and watch for the `isLoading` value.
- `startLoading`: a function that sets the `isLoading` value to `true`.
- `stopLoading`: a function that sets the `isLoading` value to `false`.
- `useData`: a hook to get and watch for the `data` value.
- `usePagination`: a hook to get and watch for the `pagination` value, default value is `null`.
- `useError`: a hook to get and watch for the `error` value.
- `success`: A function that sets the `data` value and sets the `isLoading` value to `false`.
- `failed`: A function that sets the `error` value and sets the `isLoading` value to `false`.
- `append`: A function that works only if data is `array`, it appends the new data to the end of array.
- `prepend`: A function that works only if data is `array`, it prepends the new data to the beginning of array.

Let's use the previous example of posts but this time with `fetchingAtom`

`src/atoms/posts-atom.ts`

```ts
import { fetchingAtom } from "@mongez/react-atom";

export type Post = {
  id: number;
  title: string;
  body: string;
};
// define the post type as an array for better type checking
export const postsAtom = fetchingAtom<Post[]>("posts");
```

Our atom is ready to be used, let's use it in our `Posts` component

`src/components/Posts.tsx`

```tsx
import { postsAtom } from "../atoms/posts-atom";
import { useEffect } from "react";

export default function Posts() {
  const isLoading = postsAtom.useLoading(); // watch for isLoading when it is changed
  const data = postsAtom.useData(); // watch for data when it is changed
  const error = postsAtom.useError(); // watch for error when it is changed

  useEffect(() => {
    postsAtom.startLoading();
    loadPosts()
      .then((response) => {
        postsAtom.success(response.data.posts, response.data.pagination);
      })
      .catch((error) => {
        postsAtom.failed(error);
      });
  }, []);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {data && data.map((post) => <div>{post.title}</div>)}
      {error && <div>{error.message}</div>}
    </div>
  );
}
```

## Best Practices With Atoms

Atoms have two main objectives, a triggering atom update and a listening for changes, so it is always better to separate any component that is going to be only the updating component from the component that is going to listen for changes.

In the `login` example, we have put the `loginPopup` update in the `Header` component, when user clicks on the login button, it will trigger atom update but the `Header` component is not interested in listening for changes, it is only interested in triggering the update so it will not re-render, in the meanwhile, the `LoginPopup` component is interested in listening for changes, so it will re-render when the atom is updated.

Let's put this into action, in the `fetchingAtom` example, we used triggering and listening values in the same component, let's separate them.

`src/components/Posts.tsx`

```tsx
import { postsAtom } from "../atoms/posts-atom";
import { useEffect } from "react";
import LoadingPosts from "./LoadingPosts";
import PostsList from "./PostsList";
import PostsError from "./PostsError";

export default function Posts() {
  useEffect(() => {
    postsAtom.startLoading();
    loadPosts()
      .then((response) => {
        postsAtom.success(response.data.posts);
      })
      .catch((error) => {
        postsAtom.failed(error);
      });
  }, []);

  return (
    <div>
      <LoadingPosts />
      <PostsList />
      <PostsError />
    </div>
  );
}
```

Now we have separated the triggering component from the listening components, this will make the `Posts` component only responsible for triggering the atom update, and the `LoadingPosts`, `PostsList` and `PostsError` components are only responsible for listening for changes.

Let's create these components

`src/components/LoadingPosts.tsx`

```tsx
import { postsAtom } from "../atoms/posts-atom";

export default function LoadingPosts() {
  const isLoading = postsAtom.useLoading(); // watch for isLoading when it is changed

  if (!isLoading) {
    return null;
  }

  return <div>Loading...</div>;
}
```

`src/components/PostsList.tsx`

```tsx
import { postsAtom } from "../atoms/posts-atom";

export default function PostsList() {
  const data = postsAtom.useData(); // watch for data when it is changed

  if (!data) {
    return null;
  }

  return (
    <div>
      {data.map((post) => (
        <div>{post.title}</div>
      ))}
    </div>
  );
}
```

`src/components/PostsError.tsx`

```tsx
import { postsAtom } from "../atoms/posts-atom";

export default function PostsError() {
  const error = postsAtom.useError(); // watch for error when it is changed

  if (!error) {
    return null;
  }

  return <div>{error.message}</div>;
}
```

Using this approach, `Posts` component will not re-render when the atom is updated, this will make it render only once, each other component will be rendered for first time, then based on the atom changes, each component will start interacting.

For example the `LoadingPosts` component will be rendered for first time, then when calling `startLoading` method, it will re-render again, but the `Posts` component will not re-render because it is not listening for `isLoading` changes.

## Working with Arrays

Mongez React Atom provides same [collectAtom](https://github.com/hassanzohdy/atom#working-with-atom-as-arrays) function to work with arrays in React.

```ts
import { collectAtom } from "@mongez/react-atom";

export const postsAtom = collectAtom<Post[]>("posts", []);
```

Now a simple usage of the `postsAtom` atom

```tsx
import { postsAtom } from "~/src/atoms";

export default function Posts() {
  const posts = postsAtom.useValue();

  return (
    <div>
      {posts.map((post) => (
        <div>{post.title}</div>
      ))}
    </div>
  );
}
```

### Add item to the array

```tsx
import { postsAtom } from "~/src/atoms";

export default function AddPost() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const addPost = () => {
    postsAtom.push({
      title,
      body,
    });
  };

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={addPost}>Add Post</button>
    </div>
  );
}
```

## Change Log

- V5.0.0 (12 May 2024)
  - React Atom now depends on [Mongez Atom](https://github.com/hassanzohdy/atom) package.
  - Refactored `openAtom`, `loadingAtom` and `fetchingAtom` functions to use Atom Actions.
  - Enhanced Documentation and removed any unrelated information to React Atom.
- V4.0.0 (10 Sept 2023)
  - Added `register` prop to `AtomProvider` component.
  - Removed `useWatcher` hook.
  - `use` now accepts only the key, to get the value use `useValue` hook instead.
- V3.2.0 (31 Aug 2023)
  - Enhanced Atom Provider for clone.
- V3.1.0 (24 Jun 2023)
  - Added `openAtom`, `loadingAtom` and `fetchingAtom`, functions.
- V3.0.0 (25 May 2023)
  - Add Support or SSR.
- V2.1.0 (21 Mar 2023)
  - Added `merge` method to atom.
  - Enhanced `update` typings.
  - Fixed `default` type to accept empty object.
  - `useWatcher` is now deprecated, use `use` instead.
- V2.0.1 (04 Jan 2023)
  - Fixed atom typings when using anything that is not an object.
- V2.0.0 (18 Dec 2022)
  - Removed `useAtom` hook.
  - Removed `useAtomValue` hook.
  - Removed `useAtomState` hook.
  - Removed `useAtomWatch` hook.
  - Removed `useAtomWatcher` hook.
  - Removed `getAtomValue` function.
  - Removed `name` property from atom.
  - Removed `actions`.
  - Removed atom change debounce.
  - Removed atom update debounce.
  - Added `useState` hook to atom.
  - Enhanced `atom typings`.
- V1.6.0 (14 Dec 2022)
  - Added [use](#use) method: Use atom's value or single value in a callback function.
  - Enhanced types for objects.
- V1.5.0 (25 Sept 2022)
  - Added Atom Actions
  - Enhanced Atom Update Consistency
- V1.4.1 (01 August 2022)
  - `beforeUpdate` now receives the old value as second argument and the atom object as third argument.
- V1.4.0 (31 July 2022)
  - Added [atom.addItem](#add-item-to-the-array) method: Add new item to the atom.
  - Added [atom.removeItem](#remove-item) method: Add new item to the atom.
  - Added [atom.replaceItem](#replace-item) method: update item in the atom's array.
  - Added [atom.getItem](#get-item) method: Get an item from the atom's array.
  - Added [atom.getItemIndex](#get-item) method: Get item index from the atom's array.
  - Added [atom.map](#atom-map): Map over the atom's values and trigger an update over it.
  - Added [atom.length](#get-atom-length): Get the length of the atom.
  - Added [atom.type](#atom-type): Get the atom's value type.
- V1.3.0 (28 July 2022)
  - Fixed checking bind on null values.
  - Added `useValue` method.
- V1.2.7 (25 July 2022)
  - Fixed undefined bind value for object methods when called with `atom.get` method.
- V1.2.6 (25 July 2022)
- Fixed return type of `Atom.useWatcher`
- V1.2.5 (25 July 2022)
  - Added `useWatcher` and `useWatch` embedded in the atom itself.
- V1.2.4 (6 July 2022)
- Enhanced Atom Watcher.
- V1.2.3 (01 July 2022)
- Enhanced Atom Hooks.
- V1.2.2 (09 Jun 2022)
- Enhanced Atom Watcher.
- V1.2.1 (16 Apr 2022)
  - Added [get handler function](#get-handler-function).
  - Disallowed triggering update/changes if called multiple times in the same time.
- V1.2.0 (25 Apr 2022)
  - Added atom.watch Function feature.
  - Added Atom.get Function.
  - Added Atom.change Function.
  - Added useAtomWatcher Hook.
  - Added useAtomWatch Hook.
- V1.1.0 (25 Apr 2022)
  - Added [beforeUpdate](#value-mutation-before-update) function.

```

```

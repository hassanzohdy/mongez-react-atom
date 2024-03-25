# Mongez React Atom

A powerful state management tool for React Js.

## Why?

The main purpose of the birth of this package is to work with a simple and performant state management tool to handle data among components and outside components.

## This can be a replacement for Redux

Redux is a powerful state management tool, the purpose of this package is to use a simple state management that provides a good performance with large applications.

## Features

- Simple and easy to use
- Can be used in any React Js/React Native application.
- Can be used outside components.
- Listen to atom's value change.
- Listen to atom's object property change.
- Lightweight in size.
- Supports Server Side Rendering.
- Supports React Native.
- Easy Managing Objects, Arrays, and booleans.

## Installation

`yarn add @mongez/react-atom`

Or

`npm i @mongez/react-atom`

## Atoms are unique

Atoms are meant to be **unique** therefore the atom `key` can not be used in more than one atom, if another atom is being created with a previously defined atom, an error will be thrown that indicates to use of another atom key.

## Using Atoms outside components

Atoms can be accessed outside components, this is useful when you want to use the atom's value in a function a class, or even in a service.

By embracing the idea of using atoms outside components, we can easily manage the data in a single place, this can help you update or fetch the current atom's value while you're not using it inside a component.

## Creating New Atom

The main idea here is every single data that might be manipulated will be stored independently in a shape of an `atom`.

This will raise the power of single responsibility.

```ts
import { atom, Atom } from "@mongez/react-atom";

export const currencyAtom: Atom<string> = atom({
  key: "currency",
  default: "EUR",
});
```

> Please note that all atoms are immutables, the default data will be kept untouched if it is an object or an array.

When creating a new atom, it's recommended to pass the atom's value type as a generic type to the `atom` function, this will help you use the atom's value in a type-safe way.

## Using Atoms in components

Now the `currencyAtom` atom has only a single value, from this point we can use it anywhere in our application components or event outside components.

`Header.tsx`

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

`Footer.tsx`

```tsx
import React from "react";
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

In our Header component, we just display the current value of the currency, which is the default value in our atom `EUR`.

In the `Footer` component, we also displayed the current currency in a form of a message.

Now let's add some buttons to change the current currency from the header.

`Header.tsx`

```tsx
import React from "react";
import { useAtom } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const [currency, setCurrency] = currencyAtom.useAtom();

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

Once we click on any button of the three buttons, the currency will be changed in our atom, the good thing here is it will be changed in the `Footer` component as well.

## Types of atom values

Any atom must have a `default` value when initializing it, this value can be any type, it can be a string, number, boolean, object, array, however, when the default value is an `object` or an `array`, the atom gets a **special treatment**.

We will see this later in the documentation.

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

## Update atom's value

The basic way to update an atom's value is by using `atom.update`, this method receives the new value of the atom and updates it.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.update("USD"); // any component using the atom will be rerendered automatically.
```

We can also pass a callback to the update function, the callback will receive the old value and the atom instance.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.update((oldValue, atom) => {
  // do something with the old value
  return "USD";
});
```

> Please do remember that `atom.update` must receive a new reference of the value, otherwise it will not trigger the change event, for example, `atom.update({ ...user })` will trigger the change event.

```ts
// /src/atoms/user-atom.ts
import { atom } from "@mongez/react-atom";

export type UserData = {
  name: string;
  email: string;
  age: number;
  id: number;
};

export const userAtom = atom<UserData>({
  key: "user",
  default: {
    name: "Hasan",
    age: 30,
    email: "hassanzohdy@gmail.com",
    id: 1,
  },
});
```

Now if we want to make an update for the user atom using `atom.update`, it will be something like this:

```ts
// anywhere in your app

import { userAtom } from "~/src/atoms/user-atom";

userAtom.update({
  ...userAtom.value,
  name: "Ahmed",
});
```

Or using a callback to get the old value:

```ts
// anywhere in your app

import { userAtom } from "~/src/atoms/user-atom";

userAtom.update((oldValue) => {
  return {
    ...oldValue,
    name: "Ahmed",
  };
});
```

## Silent Update (Update without triggering change event)

> Added in v3.2.0

Works exactly like `update` method, but it will not trigger the change event.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.silentUpdate("USD"); // any component using the atom will be rerendered automatically.
```

## Silent Change (Change key without triggering change event)

> Added in V4.0.0

Works exactly like `change` method, but it will not trigger the change event.

```ts
// anywhere in your app
import { userAtom } from "~/src/atoms";

userAtom.silentChange("name", "Ahmed");
```

## Merge atom's value

> Added in v2.1.0

If the atom is an object atom, you can use `atom.merge` to merge the new value with the old value.

```ts
// src/atoms/user-atom.ts
import { atom } from "@mongez/react-atom";

export type UserData = {
  name: string;
  email: string;
  age: number;
  id: number;
};

export const userAtom = atom<UserData>({
  key: "user",
  default: {
    name: "Hasan",
    age: 30,
    email: "hassanzohdy@gmail.com",
    id: 1,
  },
});
```

Now if we want to make an update for the user atom using `atom.update`, it will be something like this:

```ts
// anywhere in your app
import { userAtom } from "~/src/atoms";

userAtom.update({
  ...userAtom.value,
  name: "Ahmed",
  age: 25,
});
```

If you notice, we've to spread the old value and then add the new values, this is good, but we can use `atom.merge` instead.

```ts
// anywhere in your app
import { userAtom } from "~/src/atoms";

userAtom.merge({
  name: "Ahmed",
  age: 25,
});
```

This is just a shortcut for `atom.update`, it will merge the new value with the old value and then update the atom.

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

## Watch form object's key changes

Another super amazing feature here is to watch for a property of the atom's value if it's defined as an object.

```tsx
import React from "react";
import { atom, Atom } from "@mongez/react-atom";

type User = {
  name: string;
  email: string;
  age: number;
};

const userAtom = atom<User>({
  key: "user",
  default: {},
});
```

Now let's create a component to display the user's name and email.

```tsx
import React from "react";
import { userAtom } from "~/src/atoms";

export default function User() {
  const user = userAtom.useValue();

  return (
    <>
      <h1>User</h1>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </>
  );
}
```

Now let's update the user's name from another component.

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
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
      <input
        type="text"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />
    </>
  );
}
```

This is great, but what if we want to have a component that will be rerendered only when the user's name changes, not the email, here we can use `atom.useWatcher` to watch for a specific property of the atom's value.

```tsx
import React from "react";
import { userAtom } from "~/src/atoms";

export default function User() {
  const name = userAtom.useWatcher("name");

  return (
    <>
      <h1>User</h1>
      <p>Name: {name}</p>
    </>
  );
}
```

Now when the `name` property is changed, this component will be rerendered automatically, otherwise it won't.

## On Atom Reset

To listen to atom when it is reset, use `onReset` method.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.onReset((atom) => {
  //
});
```

> This will be triggered after the update event is triggered

## Use

Using `atom.use` will merge both `useValue` and `useWatcher` methods into one.

If the `use` received a parameter, then it will be watching for the given property change, otherwise it will watch for the entire atom's value change.

> Starting from version 2 and above, `atom.use` will be the recommended way to watch for atom's value changes for single property atoms instead of `useWatcher` as `useWatcher` will be removed in the next release.

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

Using `use` without any parameter will watch for the entire atom's value change.

```tsx
type User = {
  name: string;
  age: number;
  position: "developer" | "designer" | "manager";
  notifications: number;
};

// now in any component
import userAtom from "./userAtom";

export function Header() {
  const user = userAtom.useValue();

  return <header>{user.notifications}</header>;
}
```

This will be rerendered when the entire atom's value changes.

```tsx
type User = {
  name: string;
  age: number;
  position: "developer" | "designer" | "manager";
  notifications: number;
};

// now in any component
import userAtom from "./userAtom";

export function Header() {
  const notifications = userAtom.use("notifications"); // will return number, and Typescript will complain if you try to use other properties

  return <header>{notifications}</header>;
}
```

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

This will change only the given key in the atom's value, and trigger a component rerender if the atom's value is used in the component.

> Please note that `change` method calls `update` method under the hood, so it will generate a new object.

## Get Atom single key value

If atom's value is an object, we can get a value from the atom directly using `atom.get` function.

```ts
import { atom } from "@mongez/atom-react";

const userAtom = atom({
  key: "user",
  default: {
    key: "Hasan",
    address: {
      city: "New York",
    },
  },
});

console.log(userAtom.get("key")); // Hasan
```

Dot Notation is also supported.

```ts
console.log(userAtom.get("address.city")); // New York
```

If key doesn't exist, return default value instead.

```ts
console.log(userAtom.get("email", "default@email.com")); // default@email.com
```

## Reset value

This feature might be useful in some scenarios when we need to reset the atom's value to its default value.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.reset(); // any component using the atom will be rerendered automatically.
```

This will trigger an atom update and set the atom's value to its default value.

## Silent Reset Value (Reset without triggering change event)

> Added in v3.2.0

Sometimes its useful to reset the atom's value to its default value without triggering the change event, this can be achieved using `silentReset` method, a good sue case for this is when a component is unmounted and you want to reset the atom's value to its default value without triggering the change event.

```tsx
// Header.tsx
import { currencyAtom } from "~/src/atoms";
import { useEffect } from "react";

export default function Header() {
  const currency = currencyAtom.useValue();

  useEffect(() => {
    return () => currencyAtom.silentReset();
  }, []);

  return (
    <>
      <h1>Header</h1>
      Currency: {currency}
    </>
  );
}
```

This will not trigger the value change event, but it will reset the atom's value to its default value and **the reset event will be triggered though**

## Destroy atom

We can also destroy the atom using `destroy()` method from the atom, this will stop re-rendering any component that using the atom using `useAtom` or `useAtomState` hooks.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.destroy();
```

## Getting atom key

To get the atom key, use `atom.key` will return the atom key.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

console.log(currencyAtom.key); // currencyAtom
```

## Getting all atoms

To list all registered atoms, use `atomsList` utility for that purpose.

```ts
// anywhere in your app
import { atomsList } from "~/src/atoms";

console.log(atomsList()); // [currencyAtom, ...]
```

## get handler function

Sometimes we may need to handle the `atom.get` function to get the data in a customized way, we can achieve this by defining in the atom function call how the atom will retrieve the object's value.

Without Defining the `atom getter`

```ts
const settingsAtom = atom({
  key: "user",
  default: {
    isLoaded: false,
    settings: {},
  },
});

// later
settingsAtom.update({
  isLoaded: true,
  settings: {
    websiteName: "My Website Name",
  },
});

console.log(userAtom.get("settings.websiteName")); // My Website Name
```

After Defining it

```ts
import { atom } from "@mongez/atom-react";

const settingsAtom = atom({
  key: "settings",
  default: {
    isLoaded: false,
    settings: {},
  },
  get(key: string, defaultValue: any = null, atomValue: any) {
    return atomValue[key] !== undefined
      ? atomValue[key]
      : atomValue.settings[key] !== undefined
      ? atomValue.settings[key]
      : defaultValue;
  },
});

// later
settingsAtom.update({
  isLoaded: true,
  settings: {
    websiteName: "My Website Name",
  },
});

console.log(settingsAtom.get("websiteName")); // My Website Name
```

## Listen to atom value changes

This is what happens with `useAtom` hook, it listens to the atom's value change using `onChange` method.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.onChange((newValue, oldValue, atom) => {
  //
});
```

> Please note the `onChange` is returning an [EventSubscription](https://github.com/hassanzohdy/mongez-events#unsubscribe-to-event) instance, we can remove the listener anytime, for example when unmounting the component.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

// in your component...
const [currency, setCurrency] = useState(currencyAtom.value);
useEffect(() => {
  const onCurrencyChange = currencyAtom.onChange(setCurrency);
  return () => onCurrencyChange.unsubscribe();
}, []);
```

## Watch For Partial Change

Sometimes you may need to watch for only a key in the atom's value object, the `atom.watch` function is the perfect way to achieve this.

> Please note this only works if the atom's default is an object or an array.

```ts
// anywhere in your app
import { atom } from "@mongez/react-atom";

const userAtom = atom({
  key: "user",
  default: {
    key: "Hasan",
    address: {
      city: "New York",
    },
  },
});

userAtom.watch("key", (newName, oldName) => {
  console.log(newName, oldName); // 'Hasan', 'Ali'
});

// later in the app
userAtom.update({
  ...userAtom.value,
  key: "Ali",
});
```

Dot notation is allowed too.

```ts
// anywhere in your app
import { atom } from "@mongez/react-atom";

const userAtom = atom({
  key: "user",
  default: {
    key: "Hasan",
    address: {
      city: "New York",
    },
  },
});

userAtom.watch("address.cty", (newCity, oldCity) => {
  console.log(newName, oldName); // 'New York', 'Cairo'
});

// later in the app
userAtom.update({
  ...userAtom.value,
  address: {
    ...userAtom.value.address,
    city: "Cairo",
  },
});
```

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

## Value Mutation Before Update

Sometimes it's useful to mutate the value before updating it in the atom, this can be achieved via defining `beforeUpdate` method in the atom declaration.

This is very useful especially when dealing with objects/arrays and you want to make some operations before using the final value.

`beforeUpdate(newValue: any, oldValue: any, atom: Atom)`

```ts
import { atom, Atom } from "@mongez/react-atom";

export const multipleAtom: Atom = atom({
  key: "multiple",
  default: 0,
  beforeUpdate(newNumber: number): number {
    return newNumber * 2;
  },
});

multipleAtom.update(4);

console.log(multipleAtom.value); // 8
```

## Listen to atom destruction

To detect atom destruction when `destroy()` method, use `onDestroy`.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

const subscription = currencyAtom.onDestroy((atom) => {
  //
});
```

## Atom Type

We can get the type of the atom's value using `atom.type` property.

```tsx
const currencyAtom = atom({
  key: "currency",
  default: "USD",
});

console.log(currencyAtom.type); // string
```

If the default value is an array it will be returned as array not object.

```tsx
const todoListAtom = atom({
  key: "todo",
  default: [],
});

console.log(todoListAtom.type); // array
```

## Working with atom as arrays

> Works only if the atom's default value is array

We can get use of the following methods to make our life easier.

- [Add Item](#add-item-to-the-array) add new item to the atom's array.
- [Remove Item](#remove-item) Remove item from the atom's array.
- [Remove Items](#remove-items) Remove items from the atom's array.
- [Replace Item](#replace-item) Update item'value in the atom's array.
- [Get Item](#get-item) Get item from the atom's array.
- [Get Item Index](#get-item-index) Get item' index from the atom's array.
- [Items Map](#atom-map) Map over the atom's array items and replace it with a new one.
- [Items length](#get-atom-length) Get the length of the atom's array.

### Add Item to the array

`atom.addItem(item: any) => void`

This method will allow you adding item to the array, it will also trigger the change event.

```tsx
const todoListAtom = atom({
  key: "todo",
  default: [],
});

// SomeComponent.tsx
export function TodoList() {
  const items = todoListAtom.useValue();

  const addNewItem = () =>
    todoListAtom.addItem({
      title: "My first task",
      id: 213,
    }); // this will update the items and re-render the component again.

  return (
    <>
      Total Items: {items.length}
      <button onClick={addNewItem}>Add Item</button>
    </>
  );
}
```

### Remove Item

`atom.removeItem(index: number | (item: any, index: number) => number) => void`

To remove an item from the atom's array we can use the `removeItem` method.

```tsx
const todoListAtom = atom({
  key: "todo",
  default: [],
});

// SomeComponent.tsx
export function TodoList() {
  const items = todoListAtom.useValue();

  const addNewItem = () =>
    todoListAtom.addItem({
      title: "My first task",
      id: 213,
    }); // this will update the items and re-render the component again.

  return (
    <>
      Total Items: {items.length}
      <button onClick={addNewItem}>Add Item</button>
      {items.map((item, index) => (
        <div key={index}>
          <div>Title: {item.title}</div>
          <button onClick={() => todoListAtom.removeItem(index)}>Remove</button>
        </div>
      ))}
    </>
  );
}
```

This will remove the item by the given index.

It can also be removed by passing a callback to remove the item from the list.

```tsx
todoListAtom.removeItem((item) => item.id > 100);
```

> Please note this will only remove the first matched item.

To remove multiple items, use `removeItems` method instead.

### Remove Items

`atom.removeItem(indexes: number[] | (item: any, index: number) => number) => void`

Works exactly like `removeItem` except that it accepts an array of indexes or a callback function to remove multiple items.

```tsx
todoListAtom.removeItems([0, 2, 3]); // will remove index 0, 2 and 3

// OR

todoListAtom.remoteItems((item) => item.id > 1);
```

### Replace Item

`atom.replaceItem(index: number, newItemValue: any) => void`

Updates item's value by for the given index

```tsx
const index = 2;
todoListAtom.replaceItem(2, {
  title: "New Title",
});
```

### Get Item

`atom.getItem(indexOrCallback: number | ((item: any, index: number) => any)) => any`

Get an item from the array using item index or callback function.

```tsx
const index = 2;

const item = todoListAtom.getItem(index);

// Or
const itemId = 15111; // dummy id
const otherItem = todoListAtom.getItem((item) => item.id === itemId);
```

### Get Item Index

`atom.getItemIndex(callback: (item: any, index: number, array: any[]) => any) => any`

Get the index of the first matched element to the given callback.

```tsx
const itemId = 15111; // dummy id
const itemIndex = todoListAtom.getItemIndex((item) => item.id === itemId); // 2 for example
```

### Atom map

`atom.map(callback: (item: any, index: number, array: any[]) => any) => any`

Walk over every item in the array and update it, this will trigger the change event.

```tsx
const numbersAtom = atom({
  key: "number",
  default: [1, 2, 3, 4],
});

// multiple the atom's array numbers by 2
numbersAtom.map((number) => number * 2);

console.log(numbersAtom.value); // [2, 4, 6, 8];
```

## Get Atom length

This can be useful feature when working with arrays or strings, `atom.length` returns the count of total elements/characters of the atom's current value.

```tsx
const todoListAtom = atom({
  key: "todo",
  default: [],
});

console.log(todoListAtom.length); // 0

todoListAtom.addItem({
  title: "My first task",
  id: 213,
});

console.log(todoListAtom.length); // 1
```

## AtomProvider

> Added in V3.0.0

Atom Provider allows you to use same atom in a scoped version, this is useful when you want to deal with an atom inside an array of objects, or using the same atom in multiple components in the same page but each atom handles different data.

Wrap the code that you want to use the atom inside it with `AtomProvider`, and pass the to the `register` prop

```tsx
import { AtomProvider } from "@mongez/atom";
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
import { useAtom } from "@mongez/atom";

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
import { AtomProvider } from "@mongez/atom";
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

> Added in V4.0.0

Now atoms can lay in SSR environments like Nextjs, Remix, etc, but with a little bit of change.

To make sure that the atom's value is being updated in both client and server, we need to create a special atom provider from the atom itself.

```tsx
// src/atoms/user-atom.ts
import { atom } from "@mongez/atom";

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

> Added in V3.1.0

Helper atoms functions allow you to easily manage `variant` atoms that you would probably use in your app.

### Open Atom

The `openAtom` function is mainly used to manage an open state, this one is useful when working with modals, popups, etc.

```tsx
import { openAtom } from "@mongez/atom";

export const loginPopupAtom = openAtom("openAtom");
```

This atom exposes 4 values:

- `opened`: boolean value that indicates if the popup is opened or not.
- `open`: a function that sets the `opened` value to `true`.
- `close`: a function that sets the `opened` value to `false`.
- `toggle`: a function that toggles the `opened` value.

By default, `opened` is set to `false`, if you want to set it to `true` by default, pass `true` as the second argument to `booleanAtom` function.

```tsx
import { openAtom } from "@mongez/atom";

export const loginPopupAtom = openAtom("loginPopup", true);
```

Let's see an example of usage

`LoginPopup.tsx`

```tsx
import { loginPopupAtom } from "./atoms";

export default function LoginPopup() {
  const opened = loginPopupAtom.use("opened"); // watch for opened when it is changed
  const close = loginPopupAtom.get("close"); // use `get` not `use` function to get the function

  return (
    <Modal isOpen={opened} onClose={close}>
      <div>Login Content Here</div>
    </Modal>
  );
}
```

`Header.tsx`

```tsx
import { loginPopupAtom } from "./atoms";

export default function Header() {
  const openLoginPopup = loginPopupAtom.get("open"); // use `get` not `use` function to get the function

  return (
    <div>
      <button onClick={openLoginPopup}>Login</button>
    </div>
  );
}
```

As you can see in the above example, we used `get` function to get the `open` and `close` functions, this is because we don't want to watch for these functions, they are static functions, no changes will occur to them.

The `opened` value is watched for changes, so when the popup is opened or closed, the `LoginPopup` component will be re-rendered.

This works exactly like a normal atom, but, we can go more easier by using the atom actions directly, like `open`, `close` and `toggle`.

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

So Before:

```tsx
const open = loginPopupAtom.get("open");
```

After:

```tsx
const open = loginPopupAtom.open;
```

This applies to `close` and `toggle` functions as well.

### Loading Atom

Another good helper function is `loadingAtom` which is used to manage a loading state, this is useful when you want to show a loading indicator when a request is being made.

It has 3 values:

- `isLoading`: boolean value that indicates if the request is being made or not.
- `startLoading`: a function that sets the `isLoading` value to `true`.
- `stopLoading`: a function that sets the `isLoading` value to `false`.
- `toggleLoading`: a function that toggles the `isLoading` value.

By default, `isLoading` is set to `false`, if you want to set it to `true` by default, pass `true` as the second argument to `loadingAtom` function.

```tsx
import { loadingAtom } from "@mongez/atom";

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
  const isLoading = loadingPostsAtom.use("isLoading"); // watch for isLoading when it is changed

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

It exposes `8` values:

- `isLoading`: boolean value that indicates if the request is being made or not, default value is `false`.
- `startLoading`: a function that sets the `isLoading` value to `true`.
- `stopLoading`: a function that sets the `isLoading` value to `false`.
- `data`: the data returned from the API, default value is `null`.
- `pagination`: the pagination returned from the API, default value is `null`.
- `error`: the error returned from the API, default value is `null`.
- `success`: A function that sets the `data` value and sets the `isLoading` value to `false`.
- `failed`: A function that sets the `error` value and sets the `isLoading` value to `false`.
- `append`: A function that works only if data is `array`, it appends the new data to the existing data.
- `prepend`: A function that works only if data is `array`, it prepends the new data to the existing data.

Let's use the previous example of posts but this time with `fetchingAtom`

`src/atoms/posts-atom.ts`

```ts
import { fetchingAtom } from "@mongez/atom";

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
  const isLoading = postsAtom.use("isLoading"); // watch for isLoading when it is changed
  const data = postsAtom.use("data"); // watch for data when it is changed
  const error = postsAtom.use("error"); // watch for error when it is changed

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

Again, the exposed functions are used only with the helper atoms, like `fetchingAtom`, `loadingAtom` and `openAtom`.

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
  const isLoading = postsAtom.use("isLoading"); // watch for isLoading when it is changed

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
  const data = postsAtom.use("data"); // watch for data when it is changed

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
  const error = postsAtom.use("error"); // watch for error when it is changed

  if (!error) {
    return null;
  }

  return <div>{error.message}</div>;
}
```

Using this approach, `Posts` component will not re-render when the atom is updated, this will make it render only once, each other component will be rendered for first time, then based on the atom changes, each component will start interacting.

For example the `LoadingPosts` component will be rendered for first time, then when calling `startLoading` method, it will re-render again, but the `Posts` component will not re-render because it is not listening for `isLoading` changes.

## Change Log

## V3.3.0 (10 Sept 2023)

- Added `register` prop to `AtomProvider` component.
- Removed `useWatcher` hook.
- `use` now accepts only the key, to get the value use `useValue` hook instead.
- ## V3.2.0 (31 Aug 2023)
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

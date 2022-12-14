# Mongez React Atom

A simple state management tool for React Js.

## Why?

The main purpose of the birth of this package is to work with a simple and performant state management tool to handle data among components.

## This can be a replacement for Redux

Redux is a powerful state management tool, the purpose of this package is to use a simple state management which provides a good performance with large applications.

## Installation

`yarn add @mongez/react-atom`

Or

`npm i @mongez/react-atom`

## Usage

## Creating New Atom

The main idea here is every single data that might be manipulated will be stored independently in a shape of an `atom`.

This will raise the power of single responsibility.

```ts
import { atom, Atom } from "@mongez/react-atom";

export const currencyAtom: Atom = atom({
  key: "currency",
  default: "EUR",
});
```

> Please note that all atoms are immutables, the default data will be kept untouched if it is objects or arrays.

## Using Atoms In Components

Now the `currencyAtom` is now an atom, has only single value, from this point we can use it in anywhere in our application components or event outside components.

`Header.tsx`

```tsx
import React from "react";
import { useAtom } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const [currency, setCurrency] = useAtom(currencyAtom);

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
  const [currency] = useAtom(currencyAtom);

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
import React from "react";
import { useAtom } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const [currency, setCurrency] = useAtom(currencyAtom);

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

## Getting Atom Values Only

A shorthand way if we want only the atom value instead of the atom and the state updater is to use `useAtomValue` hook.

`Footer.tsx`

```tsx
import React from "react";
import { useAtomValue } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Footer() {
  const currency = useAtomValue(currencyAtom);

  return (
    <>
      <h1>Footer</h1>
      You're using our application in {currency} Currency.
    </>
  );
}
```

## Atom useValue

> Added in v1.3.0

Alternatively, you can get the same exact effect of `useAtomValue` by using `atom.useValue` directly from the atom itself to watch for the atom's value change.

This will of course cause a component rerender event.

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

## Getting Atom State Value Updater Only

This can be also done with the atom value updater by using `useAtomState`

`Header.tsx`

```tsx
import React from "react";
import { useAtomState } from "@mongez/react-atom";
import { currencyAtom } from "~/src/atoms";

export default function Header() {
  const setCurrency = useAtomState(currencyAtom);

  return (
    <>
      <h1>Header</h1>
      <button onClick={(e) => setCurrency("EUR")}>EUR</button>
      <button onClick={(e) => setCurrency("USD")}>USD</button>
      <button onClick={(e) => setCurrency("EGP")}>EGP</button>
    </>
  );
}
```

## The Traveling Atom

The essential point here is any atom can be updated from any component, also any component can listen to the atom's value change by using `useAtom`, `useAtomValue` or `useAtomWatcher`, thus you don't need to use any Context to pass the data between components.

## Atoms are unique

Atoms are meant to be **unique** therefore the atom `key` can not be used in more than one atom, if other atom is being created with a previously defined atom, an error will be thrown that indicates to use another atom key.

## Atom structure

Each new atom returns an atom instance, here is the atom object properties that is generated from `atom()` function.

```ts
import { EventSubscription } from "@mongez/events";

export type AtomPartialChangeCallback = (
  newValue: any,
  oldValue: any,
  atom: Atom
) => void;

/**
 * Default props
 */
export type AtomProps = {
  /**
   * Atom unique key
   */
  key: string;
  /**
   * Atom default value
   */
  default: any;
  /**
   * Make adjustments on the value before updating the atom
   */
  beforeUpdate?: (newValue: any, oldValue: any, atom: Atom) => any;
};

/**
 * The Atom Instance
 */
export type Atom = {
  /**
   * Atom unique key, set by the user
   */
  key: string;

  /**
   * Atom default value, set by the user
   */
  default: any;

  /**
   * Atom current value, initialized with the passed default value
   */
  currentValue: any;

  /**
   * Reset the atom value
   */
  reset: () => void;

  /**
   * Update atom value, the function accepts a new value,
   * or it can accept a callback that passes the old value and the atom instance
   * This will trigger atom event update
   */
  update: (value: ((oldValue: any, atom: Atom) => any) | any) => void;

  /**
   * Change only one key of the atom
   * Works only if atom's value is an object
   */
  change: (key: string, newValue: any) => void;

  /**
   * Get current value
   */
  readonly value: any;

  /**
   * Get default value that started with atom creation
   */
  readonly defaultValue: any;

  /**
   * Destroy the atom and remove it from atmos list
   * This will trigger an atom destroy event then unsubscribe all atom events
   */
  destroy: () => void;

  /**
   * An event listener to the atom value change
   * The callback accepts the new updated value, the old value and an atom instance
   */
  onChange: (
    callback: (newValue: any, oldValue: any, atom: Atom) => void
  ) => EventSubscription;

  /**
   * An event listener to the atom destruction
   */
  onDestroy(callback: (atom: Atom) => void): EventSubscription;

  /**
   * Watch for atom value change
   * This can be used only when atom's default value is an object or an array
   * The key accepts dot.notation syntax
   */
  watch: (
    key: string,
    callback: AtomPartialChangeCallback
  ) => EventSubscription;

  /**
   * Get value from atom's value
   * Works only if atom's value is an object
   */
  get(key: string, defaultValue?: any): any;

  /**
   * Watch for atom's value change and return it
   * When the atom's value is changed, the component will be rerendered again.
   */
  useValue: () => any;

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatch: (key: string, callback: AtomPartialChangeCallback) => void;

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatcher<T>(key: string): T;

  /**
   * Remove item by the given index or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItem: (
    indexOrCallback: number | ((item: any, itemIndex: number) => boolean)
  ) => void;

  /**
   * Remove list of items from the current atom for the given list of indexes or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItems: (
    indexesOrCallback: number[] | ((item: any, itemIndex: number) => boolean)
  ) => void;

  /**
   * Add item to the end of the atom's value
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  addItem: (item: any) => void;

  /**
   * Get item by the given index or callback
   *
   * Works only if atom's value is an array
   */
  getItem: (
    indexOrCallback: number | ((item: any, index: number) => any)
  ) => any;

  /**
   * Get item index by the given item
   *
   * Works only if atom's value is an array
   */
  getItemIndex: (
    callback: (item: any, index: number, array: any[]) => any
  ) => number;

  /**
   * Replace item by the given index
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  replaceItem: (index: number, item: any) => void;

  /**
   * Modify the atom's array items by the given callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  map: (callback: (item: any, index: number, array: any[]) => any) => void;

  /**
   * Get the atom's value type
   */
  readonly type;

  /**
   * Get the atom's value length
   *
   * Works only if atom's value is an array or a string
   */
  readonly length: number;
};
```

## Using Atoms outside components

Atoms can be accessed outside components from its instances directly.

## Get atom current value

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

console.log(currencyAtom.value); // get current value
```

## Get default value

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

console.log(currencyAtom.defaultValue);
```

## Updating value

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

## Atom Update Consistency

> Enhanced in v1.5.0

If the atom's new value is the same as the current value, the atom will not be updated and the component will not be rerendered, however, in arrays or objects to make sure the atom will trigger the update is to pass a new reference to the array or object.

```ts
// anywhere in your app

import { atom } from '@mongez/react-atom';

const languagesAtom = atom({
  key: 'languages',
   default: ['en', 'ar'],
});

languagesAtom.value.push('fr'); 

languagesAtom.update(languagesAtom.value); // this will not trigger the update

languagesAtom.update(['en', 'ar']); // this will trigger the update
languagesAtom.update([...languagesAtom.value, 'fr']); // this will trigger the update
```

Same applies on objects

```ts
// anywhere in your app
import { atom } from '@mongez/react-atom';

const userAtom = atom({
  key: 'user',
   default: {
    name: 'John',
    age: 30,
  },
});

const user = userAtom.value;

user.name = 'John Doe';

userAtom.update(user); // this will not trigger the update

userAtom.update({...user}); // this will trigger the update
```

## Change atom single key

If you're going to change a single key in the atom's value object, we may use `atom.change` for this purpose.

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

userAtom.change("key", "Ali");
userAtom.change("address.city", "Cairo");
```

## Reset value

This feature might be useful in some scenarios when we need to reset the atom's value to its default value.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

currencyAtom.reset(); // any component using the atom will be rerendered automatically.
```

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

## Getting atom by key

If we want more dynamic way to get atoms, we can use `getAtom` utility to get the atom using its key.

```ts
// anywhere in your app
import { getAtom } from "~/src/atoms";

const currencyAtomAtom = getAtom("currency");
```

If there is no atom with that key, it will return a `null` value instead.

## Getting atom value by key

Another way to get an atom value directly using the atom key itself is by using `getAtomValue` utility.

```ts
// anywhere in your app
import { getAtomValue } from "~/src/atoms";

console.log(getAtomValue("currencyAtom")); // EUR
```

## Getting all atoms

To list all registered atoms, use `atomsList` utility for that purpose.

```ts
// anywhere in your app
import { atomsList } from "~/src/atoms";

console.log(atomsList()); // [currencyAtom, ...]
```

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

## get handler function

Sometimes we may need to handle the `atom.get` function to get the data in customized way, we can achieve this by defining in the atom function call how the atom will retrieve the object's value.

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
  key: "user",
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

console.log(userAtom.get("websiteName")); // My Website Name
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

## Use Atom Watch Hook

When using atom inside React Component, we can use `useAtomWatch` to listen for atom key change.

```tsx
import { useAtomWatch } from "@mongez/react-atom";

export function SomeComponent() {
  const [city, setCity] = useState(userAtom.get("address.city"));

  useAtomWatch(userAtom, "address.city", setCity);

  // first time will render New York then it will render Cairo

  return <>Current City: {city}</>;
}
```

The interesting thing here is the component will be re-rendered **only and only if** the `address.city` is changed regardless the other atom's value changes.

## Internal Atom Watch Hook

> Added in v1.2.5

Alternatively, you can directly use the atom itself to listen for changes for specific key

```tsx
export function SomeComponent() {
  const [city, setCity] = useState(userAtom.get("address.city"));

  userAtom.useWatch("address.city", setCity);

  // first time will render New York then it will render Cairo

  return <>Current City: {city}</>;
}
```

## Use Atom Watcher Hook

We can also use `useAtomWatcher` hook to achieve the previous behavior in one step.

```tsx
import { useAtomWatcher } from "@mongez/react-atom";

export function SomeComponent() {
  const city = useAtomWatcher(userAtom, "address.city");

  // first time will render New York then it will render Cairo

  return <>Current City: {city}</>;
}
```

## Internal Atom Watcher Hook

> Added in v1.2.5

You can directly use the atom itself to listen for changes for specific key and perform component rerender.

```tsx
export function SomeComponent() {
  const city = userAtom.useWatcher("address.city");

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

## Updating Atom Multiple times

Regardless if you're using `atom.update` or `atom.change` and calling it multiple times, it will only trigger the update events only once as calling any of these methods are debounced.

## Atom Type

> Added in v1.4.0

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

> Added in v1.4.0

> Works only if the atom's default value is array

We can get use of the following methods to make our life easier.

- [Add Item](#add-item) add new item to the atom's array.
- [Remove Item](#remove-item) Remove item from the atom's array.
- [Remove Items](#remove-items) Remove items from the atom's array.
- [Replace Item](#replace-item) Update item'value in the atom's array.
- [Get Item](#get-item) Get item from the atom's array.
- [Get Item Index](#get-item-index) Get item' index from the atom's array.
- [Items Map](#atom-map) Map over the atom's array items and replace it with a new one.
- [Items length](#items-item) Get the atom's array length.

### Add Item

> Added in v1.4.0

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

> Added in v1.4.0

> Works only if the atom's default value is array

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

> Added in v1.4.0

> Works only if the atom's default value is array

`atom.removeItem(indexes: number[] | (item: any, index: number) => number) => void`

Works exactly like `removeItem` except that it accepts an array of indexes or a callback function to remove multiple items.

```tsx
todoListAtom.removeItems([0, 2, 3]); // will remove index 0, 2 and 3

// OR

todoListAtom.remoteItems((item) => item.id > 1);
```

### Replace Item

> Added in v1.4.0

> Works only if the atom's default value is array

`atom.replaceItem(index: number, newItemValue: any) => void`

Updates item's value by for the given index

```tsx
const index = 2;
todoListAtom.replaceItem(2, {
  title: "New Title",
});
```

### Get Item

> Added in v1.4.0

> Works only if the atom's default value is array

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

> Added in v1.4.0

> Works only if the atom's default value is array

`atom.getItemIndex(callback: (item: any, index: number, array: any[]) => any) => any`

Get the index of the first matched element to the given callback.

```tsx
const itemId = 15111; // dummy id
const itemIndex = todoListAtom.getItemIndex((item) => item.id === itemId); // 2 for example
```

### Atom map

> Added in v1.4.0

> Works only if the atom's default value is array

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

## Get Atom's length

> Added in v1.4.0

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

## Atom Actions

> Added in v1.5.0

Sometimes we need to do actions over the atom's value, for example, we want to append a string to current atom value.

```ts
const textAtom = atom({
  key: "text",
  default: "Hello",
  actions: {
    append: (text: string) => {
      textAtom.update((current) => current + text);
    }
  }
});

// now let's use it in anywhere in the app

textAtom.actions.append(" World");
```

## Use

> Added in v1.6.0

Using `atom.use` will merge both `useValue` and `useWatcher` methods into one.

If the `use` received a parameter, then it will be watching for the given property change, otherwise it will watch for the entire atom's value change.

```tsx
type User = {
  name: string;
  age: number;
  position: 'developer' | 'designer' | 'manager';
  notifications: number;
};

const userAtom = atom<User>({
  key: "user",
  default: {
    name: 'Hasan',
    age: 25,
    position: 'developer'
  },
});

// now in any component
import userAtom from './userAtom';
export function Header() {
  const notifications = userAtom.use('notifications');

  return (
    <header>
      {notifications}
    </header>
  )
}
```

This will only re-render the component when the `notifications` property changes.

Using `use` without any parameter will watch for the entire atom's value change.

```tsx
type User = {
  name: string;
  age: number;
  position: 'developer' | 'designer' | 'manager';
  notifications: number;
};

// now in any component
import userAtom from './userAtom';

export function Header() {
  const user = userAtom.use();

  return (
    <header>
      {user.notifications}
    </header>
  )
}
```

This will be rerendered when the entire atom's value changes.

> Please do remember that `atom.update` must receive a new reference of the value, otherwise it will not trigger the change event, for example `atom.update({ ...user })` will trigger the change event.

From `V1.6.0` types are enhanced, when you pass the `type` to the atom, then the `use` method will return the same type, also it will allow only properties that are defined in the type.

```tsx
type User = {
  name: string;
  age: number;
  position: 'developer' | 'designer' | 'manager';
  notifications: number;
};

// now in any component
import userAtom from './userAtom';

export function Header() {
  const notifications = userAtom.use('notifications'); // will return number, and Typescript will complain if you try to use other properties

  return (
    <header>
      {notifications}
    </header>
  )
}
```

## Change Log

- V1.6.0 (14 Dec 2022)
  - Added [use](#use) method: Use atom's value or single value in a callback function.
  - Enhanced types for objects.
- V1.5.0 (25 Sept 2022)
  - Added [Atom Actions](#atom-actions)
  - Enhanced [Atom Update Consistency](#atom-update-consistency)
- V1.4.1 (01 August 2022)
  - `beforeUpdate` now receives the old value as second argument and the atom object as third argument.
- V1.4.0 (31 July 2022)
  - Added [atom.addItem](#add-item) method: Add new item to the atom.
  - Added [atom.removeItem](#remove-item) method: Add new item to the atom.
  - Added [atom.replaceItem](#replace-item) method: update item in the atom's array.
  - Added [atom.getItem](#get-item) method: Get an item from the atom's array.
  - Added [atom.getItemIndex](#get-item) method: Get item index from the atom's array.
  - Added [atom.map](#atom-map): Map over the atom's values and trigger an update over it.
  - Added [atom.length](#atom-length): Get the length of the atom.
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
  - Added [atom.watch Function](#watch-for-partial-change) feature.
  - Added [Atom.get Function](#get-atom-single-key-value).
  - Added [Atom.change Function](#change-atom-single-key).
  - Added [useAtomWatcher Hook](#use-atom-watcher-hook).
  - Added [useAtomWatch Hook](#use-atom-watch-hook).
- V1.1.0 (25 Apr 2022)
  - Added [beforeUpdate](#value-mutation-before-update) function.

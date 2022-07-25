# Mongez React Atom

A simple state management tool for React Js.

## Why?

The main purpose of the birth of this package is to work with a simple and performant state management tool to handle data among components.

## This is not a replacement for Redux

Redux is a powerful state management tool, the purpose of this package is to use a simple state management which provides a good performance with large applications, however, its features is limited compared to Redux.

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
  name: "currency",
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

Atoms are meant to be **unique** therefore the atom `name` can not be used in more than one atom, if other atom is being created with a previously defined atom, an error will be thrown that indicates to use another atom name.

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
   * Atom unique name
   */
  name: string;
  /**
   * Atom default value
   */
  default: any;
  /**
   * Make adjustments on the value before updating the atom
   */
  beforeUpdate?: (newValue: any) => any;
};

/**
 * The Atom Instance
 */
export type Atom = {
  /**
   * Atom unique name, set by the user
   */
  name: string;
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
   * Get current value
   */
  get value(): any;
  /**
   * Get default value that started with atom creation
   */
  get defaultValue(): any;
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
  watch?: (
    key: string,
    callback: AtomPartialChangeCallback
  ) => EventSubscription;
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

## Change atom single key

If you're going to change a single key in the atom's value object, we may use `atom.change` for this purpose.

```ts
import { atom } from "@mongez/atom-react";

const userAtom = atom({
  name: "user",
  default: {
    name: "Hasan",
    address: {
      city: "New York",
    },
  },
});

userAtom.change("name", "Ali");
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

currencyAtom.reset();
```

## Getting atom name

To get the atom name, use `atom.name` will return the atom name.

```ts
// anywhere in your app
import { currencyAtom } from "~/src/atoms";

console.log(currencyAtom.name); // currencyAtom
```

## Getting atom by name

If we want more dynamic way to get atoms, we can use `getAtom` utility to get the atom using its name.

```ts
// anywhere in your app
import { getAtom } from "~/src/atoms";

const currencyAtomAtom = getAtom("currencyAtom");
```

If there is no atom with that name, it will return a `null` value instead.

## Getting atom value by name

Another way to get an atom value directly using the atom name itself is by using `getAtomValue` utility.

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
  name: "user",
  default: {
    name: "Hasan",
    address: {
      city: "New York",
    },
  },
});

console.log(userAtom.get("name")); // Hasan
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
  name: "user",
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
  name: "user",
  default: {
    isLoaded: false,
    settings: {},
  },
  get(key: string, defaultValue: any = null, atomValue: any) {
    return typeof atomValue[key] !== undefined
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
  return () => onCurrencyChange.unsubscribe;
}, []);
```

## Watch For Partial Change

Sometimes you may need to watch for only a key in the atom's value object, the `atom.watch` function is the perfect way to achieve this.

> Please note this only works if the atom's default is an object or an array.

```ts
// anywhere in your app
import { atom } from "@mongez/react-atom";

const userAtom = atom({
  name: "user",
  default: {
    name: "Hasan",
    address: {
      city: "New York",
    },
  },
});

userAtom.watch("name", (newName, oldName) => {
  console.log(newName, oldName); // 'Hasan', 'Ali'
});

// later in the app
userAtom.update({
  ...userAtom.value,
  name: "Ali",
});
```

Dot notation is allowed too.

```ts
// anywhere in your app
import { atom } from "@mongez/react-atom";

const userAtom = atom({
  name: "user",
  default: {
    name: "Hasan",
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

When using atom inside React Component, we can use `useAtomWatch` to listen form atom key change.

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

Alternatively, we can use `useAtomWatcher` hook to achieve the previous behavior in one step.

```tsx
import { useAtomWatcher } from "@mongez/react-atom";

export function SomeComponent() {
  const city = useAtomWatcher(userAtom, "address.city");

  // first time will render New York then it will render Cairo

  return <>Current City: {city}</>;
}
```

## Internal Atom Watcher Hook

> Added in 1.2.5

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

```ts
import { atom, Atom } from "@mongez/react-atom";

export const multipleAtom: Atom = atom({
  name: "multiple",
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

const subscription = currencyAtom.destroy((atom) => {
  //
});
```

## Updating Atom Multiple times

Regardless if you're using `atom.update` or `atom.change` and calling it multiple times, it will only trigger the update events only once as calling any of these methods are debounced.

## Change Log

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

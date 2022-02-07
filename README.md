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

### Creating New Atom

The main idea here is every single data that might be manipulated will be stored independently in a shape of an `atom`.

This will raise the power of single responsibility.

```ts
import { atom, Atom } from '@mongez/react-atom';

export const currentCurrency: Atom = atom({
    name: 'currency',
    default: 'EUR',
});
```

> Please note that all atoms are immutables, the default data will be kept untouched if it is objects or arrays.

### Using Atoms In Components

Now the `currentCurrency` is now an atom, has only single value, from this point we can use it in anywhere in our application components or event outside components.

`Header.tsx`

```tsx
import React from 'react';
import { useAtom } from '@mongez/react-atom';
import { currentCurrency } from '~/src/atoms';

export default function Header() {
    const [currency, setCurrency] = useAtom(currentCurrency);

    return (
        <>
            <h1>Header</h1>
            Currency: {currency}
        </>
    )
}
```

`Footer.tsx`

```tsx
import React from 'react';
import { useAtom } from '@mongez/react-atom';
import { currentCurrency } from '~/src/atoms';

export default function Footer() {
    const [currency] = useAtom(currentCurrency);

    return (
        <>
            <h1>Footer</h1>            
            You're using our application in {currency} Currency.
        </>
    )
}
```

In our Header component we just display the current value of the currency, which is the default value in our atom `EUR`.

In the `Footer` component, we also displayed the current currency in a form of a message.

Now let's add some buttons to change the current currency from the header.

`Header.tsx`

```tsx
import React from 'react';
import { useAtom } from '@mongez/react-atom';
import { currentCurrency } from '~/src/atoms';

export default function Header() {
    const [currency, setCurrency] = useAtom(currentCurrency);

    return (
        <>
            <h1>Header</h1>
            Currency: {currency}
            <button onClick={e => setCurrency('EUR')}>EUR</button>
            <button onClick={e => setCurrency('USD')}>USD</button>
            <button onClick={e => setCurrency('EGP')}>EGP</button>
        </>
    )
}
```

Once we click on any button of the three buttons, the currency will be changed in our atom, the good thing here is it will be changed in the `Footer` component as well.

### Getting Atom Values Only

A shorthand way if we want only the atom value instead of the atom and the state updater is to use `useAtomValue` hook.

`Footer.tsx`

```tsx
import React from 'react';
import { useAtomValue } from '@mongez/react-atom';
import { currentCurrency } from '~/src/atoms';

export default function Footer() {
    const currency = useAtomValue(useAtomValue);

    return (
        <>
            <h1>Footer</h1>            
            You're using our application in {currency} Currency.
        </>
    )
}
```

### Getting Atom State Value Updater Only

This can be also done with the atom value updater by using `useAtomState`

`Header.tsx`

```tsx
import React from 'react';
import { useAtomState } from '@mongez/react-atom';
import { currentCurrency } from '~/src/atoms';

export default function Header() {
    const setCurrency = useAtomState(currentCurrency);

    return (
        <>
            <h1>Header</h1>
            <button onClick={e => setCurrency('EUR')}>EUR</button>
            <button onClick={e => setCurrency('USD')}>USD</button>
            <button onClick={e => setCurrency('EGP')}>EGP</button>
        </>
    )
}
```

### The Traveling Atom

The name point here is any atom can be updated from any component, also any component can listen to thg atom's value change by using `useAtom` or `useAtomValue`, thus you don't need to use any Context to pass the data between components.

## Atoms are unique

Atoms are meant to be **unique** therefore the atom `name` can not be used in more than one atom, if other atom is being created with a previously defined atom, an error will be thrown that indicates to use another name name.

### Atom structure

Each new atom returns an atom instance, here is the atom object properties that is generated from `atom()` function.

```ts
import { EventSubscription } from "@mongez/events";
type Atom = {
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
};
```

## Using Atoms outside components

Atoms can be accessed outside components from its instances directly.

## Get atom current value

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

console.log(currentCurrency.value); // get current value
```

### Get default value

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

console.log(currentCurrency.defaultValue); 
```

### Updating value

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

currentCurrency.update('USD'); // any component using the atom will be rerendered automatically.
```

### Reset value

This feature might be useful in some scenarios when we need to reset the atom's value to its default value.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

currentCurrency.reset(); // any component using the atom will be rerendered automatically.
```

### Destroy atom

We can also destroy the atom using `destroy()` method from the atom, this will stop re-rendering any component that using the atom using `useAtom` or `useAtomState` hooks.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

currentCurrency.reset(); 
```

### Getting atom name

To get the atom name, use `atom.name` will return the atom name.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

console.log(currentCurrency.name); // currentCurrency
```

### Getting atom by name

If we want more dynamic way to get atoms, we can use `getAtom` utility to get the atom using its name.

```ts
// anywhere in your app
import { getAtom } from '~/src/atoms';

const currentCurrencyAtom = getAtom('currentCurrency');
```

If there is no atom with that name, it will return a `null` value instead.

### Getting atom value by name

Another way to get an atom value directly using the atom name itself is by using `getAtomValue` utility.

```ts
// anywhere in your app
import { getAtomValue } from '~/src/atoms';

console.log(getAtomValue('currentCurrency')); // EUR
```

### Getting all atoms

To list all registered atoms, use `atomsList` utility for that purpose.

```ts
// anywhere in your app
import { atomsList } from '~/src/atoms';

console.log(atomsList()); // [currentCurrency, ...]
```

### Listen to atom value changes

This is what happens with `useAtom` hook, it listens to the atom's value change using `onChange` method.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

currentCurrency.onChange((newValue, oldValue, atom) => {
    //
});
```

> Please note the `onChange` is returning an [EventSubscription](https://github.com/hassanzohdy/mongez-events#unsubscribe-to-event) instance, we can remove the listener anytime, for example when unmounting the component.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

const subscription = currentCurrency.onChange((newValue, oldValue, atom) => {
    //
});

setTimeout(() => {
    subscription.unsubscribe();
}, 3000);
```

### Listen to atom destruction

To detect atom destruction when `destroy()` method, use `onDestroy`.

```ts
// anywhere in your app
import { currentCurrency } from '~/src/atoms';

const subscription = currentCurrency.destroy((atom) => {
    //
});
```

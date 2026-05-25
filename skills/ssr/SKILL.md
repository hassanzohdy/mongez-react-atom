---
name: mongez-react-atom-ssr
description: How to use AtomStoreProvider, useAtom, useAtomStore, and the hydration utilities (HydrateAtomsScript, readHydration, serializeStore, serializeSnapshot) for SSR-safe, per-request atom isolation and client hydration.
when_to_use: User uses AtomStoreProvider or needs per-request atom isolation in SSR, user imports useAtom/useAtomStore from "@mongez/react-atom", user calls HydrateAtomsScript or readHydration, user asks how to avoid hydration mismatches with atom state in Next.js App Router or any SSR framework, user needs to pre-fill atoms on the server and transfer state to the client.
---
# SSR & stores

The module-level atom registry is shared per Node process. To keep concurrent SSR requests from leaking state into each other, wrap your tree in `<AtomStoreProvider>` — each request gets its own scoped clones of every atom that's read inside it.

## `<AtomStoreProvider>`

```tsx
import { AtomStoreProvider } from "@mongez/react-atom";

<AtomStoreProvider>
  <App />
</AtomStoreProvider>
```

Props:

```ts
type AtomStoreProviderProps = {
  store?: AtomStore;                          // bring your own; otherwise auto-created
  initialAtoms?: Atom<any>[];                 // pre-register these
  initialValues?: Record<string, unknown>;    // hydration values keyed by atom key
  children: React.ReactNode;
};
```

- An auto-created store is destroyed on unmount.
- A `store` passed via props is caller-owned (NOT destroyed by the provider).
- `initialValues` are applied via `silentUpdate` so the first render of subscribers sees the hydrated values; no flash.

## `useAtom(template | key)`

Two overloads.

```ts
useAtom(template: Atom<V, A>): Atom<V, A>            // → store-scoped clone (or the template if no provider)
useAtom(key: string): Atom<V> | undefined             // → scoped clone by key, or undefined
```

The per-atom hooks (`useValue`, `useState`, `use`, `useWatch`) already resolve internally — you only need `useAtom(template)` explicitly when you want to call an action method from an event handler in an SSR-safe way:

```tsx
function LogoutButton() {
  const scopedAuth = useAtom(authAtom);
  return <button onClick={() => scopedAuth.logout()}>Log out</button>;
}
```

The string overload is a legacy escape hatch — prefer the template overload.

## `useAtomStore()`

Returns the active `AtomStore` or `null` if no provider is mounted. Use for advanced cases: snapshotting on demand, manually hydrating, integrating with a non-React layer.

## Snapshot / Hydrate

```ts
serializeSnapshot(snapshot: Record<string, unknown>, options?: { replacer, space }): string
serializeStore(store: AtomStore, options?): string
readHydration(id?: string): Record<string, unknown> | null

<HydrateAtomsScript
  snapshot={snapshotOrString}
  id="__mongez_atom_state"   // optional; default constant
  nonce={cspNonce}           // optional
/>
```

- `serializeSnapshot` / `serializeStore` produce a string safe to embed in `<script type="application/json">`: `</script>` and U+2028/U+2029 are escaped.
- `<HydrateAtomsScript>` renders an inline JSON script tag. Place it once per `<AtomStoreProvider>` you want to hydrate.
- `readHydration()` is the client-side companion: parses the JSON out of the script tag. Returns `null` if missing or malformed.

### Why hydrate at all?

Without hydration, atoms on the client start from their `default` value. For data the server already has (current user, feature flags, initial page data), this means the first render shows a loading state — or worse, a different UI than the server rendered — causing a **hydration mismatch** or a visible content flash.

Hydration lets you:
1. Fetch data once on the server (no extra client round-trip on load).
2. Inline the result as JSON in the HTML.
3. Have the client's atom start pre-filled — first render matches server HTML, no flash.

### Real-world example — pre-loading the current user (Next.js App Router)

```ts
// atoms/user.ts — shared between server and client
import { atom } from "@mongez/react-atom";

type User = { id: number; name: string; role: "admin" | "viewer" } | null;

export const currentUserAtom = atom<User>({ key: "currentUser", default: null });
```

```tsx
// app/layout.tsx — SERVER component
import { createAtomStore } from "@mongez/atom";
import { AtomStoreProvider, HydrateAtomsScript } from "@mongez/react-atom";
import { getCurrentUser } from "@/lib/auth";   // your server-side auth helper
import { currentUserAtom } from "@/atoms/user";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Runs on the server — no client round-trip needed
  const user = await getCurrentUser();

  const store = createAtomStore();
  store.use(currentUserAtom).update(user);     // pre-fill the store

  return (
    <html lang="en">
      <body>
        <AtomStoreProvider store={store}>
          {children}
          {/* Serialises atom state into an inline <script type="application/json"> tag */}
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
  // readHydration() parses the JSON script tag injected by the server.
  // Pass it as initialValues so the client store starts pre-filled.
  return (
    <AtomStoreProvider initialValues={readHydration() ?? undefined}>
      {children}
    </AtomStoreProvider>
  );
}
```

```tsx
// components/UserMenu.tsx — any client component
"use client";
import { currentUserAtom } from "@/atoms/user";

export function UserMenu() {
  const user = currentUserAtom.useValue();

  // user is never null on first render — the server already fetched it.
  // No loading spinner, no hydration mismatch.
  if (!user) return <a href="/login">Sign in</a>;
  return (
    <div>
      <span>{user.name}</span>
      {user.role === "admin" && <a href="/admin">Admin</a>}
    </div>
  );
}
```

Without this pattern `currentUserAtom.useValue()` would be `null` on the client's first render even though the server knew the user — you'd see a brief "Sign in" flicker before the client fetched and re-rendered.

## End-to-end minimal example

```tsx
// server component
import { createAtomStore } from "@mongez/atom";
import { AtomStoreProvider, HydrateAtomsScript } from "@mongez/react-atom";

export default function Layout({ children }) {
  const store = createAtomStore();
  store.use(someAtom).update(serverFetchedValue);
  return (
    <AtomStoreProvider store={store}>
      {children}
      <HydrateAtomsScript snapshot={store.snapshot()} />
    </AtomStoreProvider>
  );
}
```

```tsx
// client root
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

## Concurrent isolation

`<AtomStoreProvider>` instances are independent. Two providers in different parts of the tree don't share state — useful for multi-tenant dashboards or A/B split views.

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

import { act, render, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { atoms, createAtomStore } from "@mongez/atom";
import { atom } from "../react-atom";
import { AtomStoreProvider, useAtom, useAtomStore } from "../store";
import { AtomProvider } from "../context";

afterEach(() => {
  for (const key of Object.keys(atoms)) {
    atoms[key].destroy();
  }
});

describe("AtomStoreProvider", () => {
  it("scopes atom state per provider", () => {
    const userAtom = atom({
      key: "store.scope.user",
      default: { name: "Alice" },
    });

    let storeA: ReturnType<typeof useAtomStore> = null;
    let storeB: ReturnType<typeof useAtomStore> = null;

    function CaptureA() {
      storeA = useAtomStore();
      (userAtom as any).useValue(); // also touch via hook
      return null;
    }
    function CaptureB() {
      storeB = useAtomStore();
      (userAtom as any).useValue();
      return null;
    }

    render(
      <>
        <AtomStoreProvider>
          <CaptureA />
        </AtomStoreProvider>
        <AtomStoreProvider>
          <CaptureB />
        </AtomStoreProvider>
      </>
    );

    expect(storeA).not.toBe(storeB);

    // Mutate the scoped clone in store A.
    act(() => {
      storeA!.use(userAtom).change("name" as any, "FromA");
    });

    expect(storeA!.get("store.scope.user")?.value).toEqual({ name: "FromA" });
    expect(storeB!.get("store.scope.user")?.value).toEqual({ name: "Alice" });
    // The module-level template is never touched.
    expect(userAtom.value).toEqual({ name: "Alice" });
  });

  it("hooks fall back to the singleton when no provider is mounted", () => {
    const counter = atom({ key: "store.fallback.singleton", default: 0 });

    const { result } = renderHook(() => (counter as any).useState());
    act(() => {
      result.current[1](5);
    });
    expect(counter.value).toBe(5);
  });

  it("hooks operate on the scoped clone when a provider is mounted (template untouched)", () => {
    const counter = atom({ key: "store.scope.untouched", default: 0 });

    function Setter() {
      const [, setValue] = (counter as any).useState();
      React.useEffect(() => {
        setValue(99);
      }, []);
      return null;
    }

    render(
      <AtomStoreProvider>
        <Setter />
      </AtomStoreProvider>
    );

    // The original template should still hold 0.
    expect(counter.value).toBe(0);
  });

  it("initialValues hydrates atoms that are used later", () => {
    const profile = atom({
      key: "store.hydrate.profile",
      default: { name: "Default" },
    });

    let seen: any = null;
    function Peek() {
      seen = (profile as any).useValue();
      return null;
    }

    render(
      <AtomStoreProvider
        initialValues={{ "store.hydrate.profile": { name: "Hydrated" } }}
      >
        <Peek />
      </AtomStoreProvider>
    );

    expect(seen.name).toBe("Hydrated");
  });

  it("destroys auto-created stores on unmount", () => {
    const counter = atom({ key: "store.cleanup", default: 0 });

    let storeRef: any = null;
    function Capture() {
      storeRef = useAtomStore();
      // touch the atom so a clone is created
      (counter as any).useValue();
      return null;
    }

    const { unmount } = render(
      <AtomStoreProvider>
        <Capture />
      </AtomStoreProvider>
    );

    expect(storeRef?.has("store.cleanup")).toBe(true);
    unmount();
    expect(storeRef?.has("store.cleanup")).toBe(false);
  });

  it("does NOT auto-destroy stores passed in via props", () => {
    const counter = atom({ key: "store.external", default: 0 });
    const external = createAtomStore();
    external.use(counter);

    function Inner() {
      (counter as any).useValue();
      return null;
    }

    const { unmount } = render(
      <AtomStoreProvider store={external}>
        <Inner />
      </AtomStoreProvider>
    );

    unmount();
    // Caller owns the store; it should still be alive.
    expect(external.has("store.external")).toBe(true);
  });
});

describe("useAtom (template form)", () => {
  it("returns the template when no provider is mounted", () => {
    const counter = atom({ key: "resolved.no-provider", default: 0 });
    const { result } = renderHook(() => useAtom(counter));
    expect(result.current).toBe(counter);
  });

  it("returns the store-scoped clone when a provider is mounted", () => {
    const counter = atom({ key: "resolved.with-provider", default: 0 });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AtomStoreProvider>{children}</AtomStoreProvider>
    );

    const { result } = renderHook(() => useAtom(counter), { wrapper });
    expect(result.current).not.toBe(counter);
    expect(result.current!.key.startsWith("resolved.with-provider.clone.")).toBe(
      true
    );
  });
});

describe("useAtom (string-key form)", () => {
  it("returns undefined when no provider is mounted", () => {
    const counter = atom({ key: "by-key.no-provider", default: 0 });
    const { result } = renderHook(() => useAtom("by-key.no-provider"));
    // void usage to keep `counter` in scope so afterEach cleans up
    void counter;
    expect(result.current).toBeUndefined();
  });

  it("returns the scoped atom by key when present in the store", () => {
    const userAtom = atom({
      key: "by-key.user",
      default: { name: "Alice" },
    });

    let looked: ReturnType<typeof useAtom> = undefined;
    function Peek() {
      // Touch via hook so the atom enters the store, then read by key.
      (userAtom as any).useValue();
      looked = useAtom("by-key.user");
      return null;
    }

    render(
      <AtomStoreProvider>
        <Peek />
      </AtomStoreProvider>,
    );

    expect(looked).toBeDefined();
    expect(looked!.value).toEqual({ name: "Alice" });
  });
});

describe("Legacy <AtomProvider> backwards-compat shim", () => {
  it("delegates to AtomStoreProvider and pre-registers `register` atoms", () => {
    const userAtom = atom({ key: "legacy.user", default: { name: "Alice" } });

    let lookedUp: ReturnType<typeof useAtom> = undefined;
    function Peek() {
      lookedUp = useAtom("legacy.user");
      return null;
    }

    render(
      <AtomProvider register={[userAtom]}>
        <Peek />
      </AtomProvider>,
    );

    expect(lookedUp).toBeDefined();
    expect(lookedUp!.value).toEqual({ name: "Alice" });
  });
});

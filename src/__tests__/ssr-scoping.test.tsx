/**
 * SSR/CSR scoping fixes for `@mongez/react-atom`.
 *
 * "Server" tests delete `globalThis.document` around `renderToString` so the
 * code under test sees a real non-browser runtime (the happy-dom test
 * environment defines `document`, which would otherwise mask every
 * server-only branch).
 */
import { act, render } from "@testing-library/react";
import React, { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atoms, createAtomStore, getAtom } from "@mongez/atom";
import { atom, useLocalAtom } from "../react-atom";
import { AtomStoreProvider, useAtom, useAtomStore } from "../store";

/**
 * An in-memory `localStorage`. Recent Node versions ship an experimental
 * global `localStorage` that shadows happy-dom's and has no methods unless
 * `--localstorage-file` is set, so the tests install their own.
 */
function memoryLocalStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: memoryLocalStorage(),
    configurable: true,
  });
});

afterEach(() => {
  for (const key of Object.keys(atoms)) atoms[key].destroy();

  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  }
});

/** Run `fn` as if there were no DOM (Node, edge runtime, worker). */
function asServer<T>(fn: () => T): T {
  const original = globalThis.document;
  // @ts-expect-error simulate a non-browser runtime
  delete globalThis.document;
  try {
    return fn();
  } finally {
    globalThis.document = original;
  }
}

/** Strip the comment markers React 18 puts between adjacent text nodes. */
function text(html: string): string {
  return html.replace(/<!--\s*-->/g, "");
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("fail closed on the server", () => {
  it("throws, naming the atom key and the fix, when no provider is mounted", () => {
    const form = atom({ key: "fc.form", default: { name: "" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Page() {
      return <p>{(form as any).useValue().name}</p>;
    }

    expect(() => asServer(() => renderToString(<Page />))).toThrowError(
      /Atom "fc\.form".*<AtomStoreProvider>/s,
    );

    errorSpy.mockRestore();
  });

  it("also throws for the useAtom(key) form", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Page() {
      useAtom("fc.by-key");
      return null;
    }

    expect(() => asServer(() => renderToString(<Page />))).toThrowError(
      /Atom "fc\.by-key"/,
    );

    errorSpy.mockRestore();
  });

  it("renders fine on the server under a provider", () => {
    const form = atom({ key: "fc.ok", default: { name: "Ada" } });

    function Page() {
      return <p>name={(form as any).useValue().name}</p>;
    }

    const html = asServer(() =>
      renderToString(
        <AtomStoreProvider>
          <Page />
        </AtomStoreProvider>,
      ),
    );

    expect(text(html)).toContain("name=Ada");
  });

  it("keeps the singleton fallback in a browser (backward compatible)", () => {
    const counter = atom({ key: "fc.browser", default: 1 });

    function Page() {
      return <p>n={(counter as any).useValue()}</p>;
    }

    const { container } = render(<Page />);

    expect(text(container.innerHTML)).toContain("n=1");
    act(() => counter.update(2));
    expect(text(container.innerHTML)).toContain("n=2");
  });
});

describe("no cross-request leak", () => {
  it("two overlapping requests render their own state, and template writes never reach a store", async () => {
    const form = atom({ key: "leak.form", default: { name: "" } });

    function Page() {
      return <p>name={(form as any).useValue().name}</p>;
    }

    async function handleRequest(name: string, delayMs: number) {
      const store = createAtomStore();
      store.hydrate({ "leak.form": { name } });
      await sleep(delayMs); // the other request runs while this one waits

      return asServer(() =>
        renderToString(
          <AtomStoreProvider store={store}>
            <Page />
          </AtomStoreProvider>,
        ),
      );
    }

    const first = handleRequest("ALICE", 15);
    const second = handleRequest("BOB", 5);

    // A stray write on the imported template, mid-flight.
    form.update({ name: "STRAY" });

    const [htmlA, htmlB] = await Promise.all([first, second]);

    expect(text(htmlA)).toContain("name=ALICE");
    expect(text(htmlB)).toContain("name=BOB");

    // A request that seeds nothing renders the DEFAULT, not the stray write.
    const htmlC = asServer(() =>
      renderToString(
        <AtomStoreProvider>
          <Page />
        </AtomStoreProvider>,
      ),
    );

    expect(text(htmlC)).toContain("name=<");
    expect(text(htmlC)).not.toContain("STRAY");
  });
});

describe("hooks and actions are scoped end to end", () => {
  it("useAtom(template).useValue() keeps using the same scoped clone", () => {
    const counter = atom({
      key: "scope.hook",
      default: 0,
      actions: {
        bump() {
          this.update(this.value + 1);
        },
      },
    });

    let storeRef: ReturnType<typeof useAtomStore> = null;
    let scopedRef: any = null;

    function Page() {
      storeRef = useAtomStore();
      const scoped = useAtom(counter) as any;
      scopedRef = scoped;
      const viaScoped = scoped.useValue();
      const viaTemplate = (counter as any).useValue();
      return (
        <p>
          scoped={viaScoped} template={viaTemplate}
        </p>
      );
    }

    const { container } = render(
      <AtomStoreProvider>
        <Page />
      </AtomStoreProvider>,
    );

    // One clone for both call shapes, not a clone of a clone.
    expect(storeRef!.list()).toHaveLength(1);

    act(() => scopedRef.bump());

    expect(text(container.textContent ?? "")).toBe("scoped=1 template=1");
    expect(counter.value).toBe(0);
  });

  it("use(key) called on the scoped clone follows the same clone", () => {
    const form = atom({ key: "scope.key", default: { name: "a" } });
    let storeRef: ReturnType<typeof useAtomStore> = null;

    function Page() {
      storeRef = useAtomStore();
      const scoped = useAtom(form) as any;
      return <p>{scoped.use("name")}</p>;
    }

    const { container } = render(
      <AtomStoreProvider>
        <Page />
      </AtomStoreProvider>,
    );

    act(() => {
      storeRef!.use(form).change("name", "b");
    });

    expect(container.textContent).toBe("b");
    expect(storeRef!.list()).toHaveLength(1);
  });

  it("template.destroy() does not unsubscribe mounted store clones", () => {
    const form = atom({ key: "scope.destroy", default: { name: "a" } });
    let storeRef: ReturnType<typeof useAtomStore> = null;

    function Page() {
      storeRef = useAtomStore();
      return <p>{(form as any).useValue().name}</p>;
    }

    const { container } = render(
      <AtomStoreProvider>
        <Page />
      </AtomStoreProvider>,
    );

    form.destroy();
    act(() => {
      storeRef!.get("scope.destroy")!.update({ name: "still-live" });
    });

    expect(container.textContent).toBe("still-live");
  });
});

describe("getServerSnapshot", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("keeps the first client render identical to the server HTML even if the store changes mid-hydration", () => {
    const label = atom({ key: "gss.label", default: "default" });

    function Reader({ id }: { id: string }) {
      return <span id={id}>{(label as any).useValue()}</span>;
    }

    /** Mutates the live store while the tree is still hydrating. */
    function MidHydrationWrite() {
      const store = useAtomStore()!;
      store.use(label).silentUpdate("CHANGED");
      return null;
    }

    const tree = (props: { initialValues?: Record<string, unknown> }) => (
      <AtomStoreProvider initialValues={props.initialValues}>
        <Reader id="first" />
        <MidHydrationWrite />
        <Reader id="second" />
      </AtomStoreProvider>
    );

    // Server: the write happens too, but a server render has one pass, so
    // both readers see the same value.
    const serverHtml = asServer(() =>
      renderToString(
        <AtomStoreProvider initialValues={{ "gss.label": "from-server" }}>
          <Reader id="first" />
          <Reader id="second" />
        </AtomStoreProvider>,
      ),
    );
    container.innerHTML = serverHtml;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      hydrateRoot(container, tree({ initialValues: { "gss.label": "from-server" } }));
    });

    // No hydration mismatch: the second reader saw the hydrated value, not
    // the live one written after the first reader rendered.
    expect(errorSpy).not.toHaveBeenCalled();
    // After hydration the live value takes over.
    expect(container.querySelector("#first")!.textContent).toBe("CHANGED");
    expect(container.querySelector("#second")!.textContent).toBe("CHANGED");

    errorSpy.mockRestore();
  });

  it("is stable across the server render: the same snapshot object on every call", () => {
    const profile = atom({ key: "gss.stable", default: { name: "Ada" } });
    const seen: unknown[] = [];

    function Reader() {
      seen.push((profile as any).useValue());
      return null;
    }

    asServer(() =>
      renderToString(
        <AtomStoreProvider>
          <Reader />
          <Reader />
        </AtomStoreProvider>,
      ),
    );

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });
});

describe("StrictMode", () => {
  it("keeps the store and its hydrated values across the simulated remount", async () => {
    const form = atom({ key: "strict.form", default: { name: "default" } });
    let storeRef: ReturnType<typeof useAtomStore> = null;

    function Page() {
      storeRef = useAtomStore();
      return <p>{(form as any).use("name")}</p>;
    }

    const { container } = render(
      <StrictMode>
        <AtomStoreProvider initialValues={{ "strict.form": { name: "hydrated" } }}>
          <Page />
        </AtomStoreProvider>
      </StrictMode>,
    );

    await act(async () => {
      await sleep(10);
    });

    expect(container.textContent).toBe("hydrated");
    expect(storeRef!.has("strict.form")).toBe(true);

    // The mounted subscription is still wired to the live clone.
    act(() => {
      storeRef!.get("strict.form")!.update({ name: "after-remount" });
    });
    expect(container.textContent).toBe("after-remount");
  });

  it("still destroys the auto-created store on a real unmount", async () => {
    const counter = atom({ key: "strict.unmount", default: 0 });
    let storeRef: ReturnType<typeof useAtomStore> = null;

    function Page() {
      storeRef = useAtomStore();
      (counter as any).useValue();
      return null;
    }

    const { unmount } = render(
      <StrictMode>
        <AtomStoreProvider>
          <Page />
        </AtomStoreProvider>
      </StrictMode>,
    );

    await act(async () => {
      await sleep(10);
    });
    expect(storeRef!.has("strict.unmount")).toBe(true);

    unmount();
    await sleep(10);

    expect(storeRef!.has("strict.unmount")).toBe(false);
  });
});

describe("persist is read after mount, never at creation or on the server", () => {
  it("does not read storage when the atom is created", () => {
    window.localStorage.setItem("persist.create", JSON.stringify("STORED"));

    const theme = atom({
      key: "persist.create",
      default: "default",
      persist: true,
    });

    expect(theme.value).toBe("default");
  });

  it("renders the default on the first client render, then applies the stored value", () => {
    window.localStorage.setItem("persist.hydrate", JSON.stringify("STORED"));
    const theme = atom({
      key: "persist.hydrate",
      default: "default",
      persist: true,
    });

    function Reader() {
      return <span>{(theme as any).useValue()}</span>;
    }

    // What the server (which has no storage) would have sent.
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = "<span>default</span>";

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      hydrateRoot(container, <Reader />);
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(container.textContent).toBe("STORED");

    errorSpy.mockRestore();
    container.remove();
  });

  it("never touches the adapter during a server render", () => {
    const adapter = {
      get: vi.fn(() => "STORED"),
      set: vi.fn(),
      remove: vi.fn(),
    };
    const theme = atom({
      key: "persist.server",
      default: "default",
      persist: adapter,
    });

    function Reader() {
      return <span>{(theme as any).useValue()}</span>;
    }

    const html = asServer(() =>
      renderToString(
        <AtomStoreProvider>
          <Reader />
        </AtomStoreProvider>,
      ),
    );

    expect(text(html)).toContain(">default<");
    expect(adapter.get).not.toHaveBeenCalled();
  });

  it("persistHydration: 'immediate' restores the old read-at-creation behavior", () => {
    window.localStorage.setItem("persist.immediate", JSON.stringify("STORED"));

    const theme = atom({
      key: "persist.immediate",
      default: "default",
      persist: true,
      persistHydration: "immediate",
    });

    expect(theme.value).toBe("STORED");
  });
});

describe("local atoms", () => {
  it("atom({ register: false }) stays out of the registry and out of the store", () => {
    const local = atom({ key: "local.opt", default: 1, register: false });
    let storeRef: ReturnType<typeof useAtomStore> = null;

    function Page() {
      storeRef = useAtomStore();
      return <p>{(local as any).useValue()}</p>;
    }

    const { container } = render(
      <AtomStoreProvider>
        <Page />
      </AtomStoreProvider>,
    );

    expect(getAtom("local.opt")).toBeUndefined();
    expect(storeRef!.list()).toHaveLength(0);
    act(() => local.update(2));
    expect(container.textContent).toBe("2");
  });

  it("useLocalAtom gives each component instance its own state and needs no provider on the server", () => {
    function Field({ initial }: { initial: string }) {
      const field = useLocalAtom({
        key: "local.field",
        default: { value: initial },
      });

      return <span>{(field as any).use("value")}</span>;
    }

    const htmlA = asServer(() => renderToString(<Field initial="A" />));
    const htmlB = asServer(() => renderToString(<Field initial="B" />));

    expect(text(htmlA)).toContain(">A<");
    expect(text(htmlB)).toContain(">B<");
    expect(Object.keys(atoms).filter(key => key.startsWith("local.field"))).toEqual(
      [],
    );
  });

  it("useLocalAtom instances do not share events, even with the same key", () => {
    const refs: any[] = [];

    function Field({ id }: { id: string }) {
      const field = useLocalAtom({ key: "local.same", default: { value: id } });
      refs.push(field);
      return <span id={id}>{(field as any).use("value")}</span>;
    }

    const { container } = render(
      <>
        <Field id="one" />
        <Field id="two" />
      </>,
    );

    expect(refs[0].key).not.toBe(refs[1].key);

    act(() => refs[0].change("value", "changed"));

    expect(container.querySelector("#one")!.textContent).toBe("changed");
    expect(container.querySelector("#two")!.textContent).toBe("two");
  });

  it("useLocalAtom destroys its atom on unmount but survives StrictMode", async () => {
    let ref: any = null;
    const cb = vi.fn();

    function Field() {
      ref = useLocalAtom({ key: "local.life", default: 0 });
      return <span>{(ref as any).useValue()}</span>;
    }

    const { container, unmount } = render(
      <StrictMode>
        <Field />
      </StrictMode>,
    );

    await act(async () => {
      await sleep(10);
    });

    act(() => ref.update(3));
    expect(container.textContent).toBe("3");

    ref.onChange(cb);
    unmount();
    await sleep(10);
    ref.update(4);

    expect(cb).not.toHaveBeenCalled();
  });
});

describe("watchers on null-default atoms", () => {
  it("use(key) re-renders when an atom declared with default null receives an object", () => {
    const user = atom<{ name: string } | null>({
      key: "nulldef.user",
      default: null,
    });

    function Page() {
      return <p>{(user as any).use("name") ?? "none"}</p>;
    }

    const { container } = render(<Page />);
    expect(container.textContent).toBe("none");

    act(() => user.update({ name: "Ada" }));

    expect(container.textContent).toBe("Ada");
  });
});

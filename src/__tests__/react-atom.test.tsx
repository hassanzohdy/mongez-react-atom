import { act, render, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { atoms } from "@mongez/atom";
import { atom } from "../react-atom";
import type { ReactAtom } from "../types";

afterEach(() => {
  for (const key of Object.keys(atoms)) {
    atoms[key].destroy();
  }
});

describe("React atom — useState", () => {
  it("returns [value, setter] and re-renders on update", () => {
    const counter = atom({ key: "rx.useState.basic", default: 0 });

    const { result } = renderHook(() => (counter as any).useState());
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](5);
    });
    expect(result.current[0]).toBe(5);
  });

  it("setter identity is stable across renders for the same atom", () => {
    const counter = atom({ key: "rx.useState.stable-setter", default: 0 });

    const { result, rerender } = renderHook(() => (counter as any).useState());
    const setterA = result.current[1];
    rerender();
    const setterB = result.current[1];
    expect(setterA).toBe(setterB);
  });

  it("setter accepts an updater function", () => {
    const counter = atom({ key: "rx.useState.updater-fn", default: 10 });
    const { result } = renderHook(() => (counter as any).useState());
    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });
    expect(result.current[0]).toBe(11);
  });
});

describe("React atom — useValue", () => {
  it("returns the current value and re-renders on update", () => {
    const counter = atom({ key: "rx.useValue.basic", default: 7 });

    const { result } = renderHook(() => (counter as any).useValue());
    expect(result.current).toBe(7);

    act(() => {
      counter.update(99);
    });
    expect(result.current).toBe(99);
  });
});

describe("React atom — use(key)", () => {
  it("returns the value at the given key and re-renders only when that key changes", () => {
    type User = { name: string; age: number };
    const user = atom<User>({
      key: "rx.use.basic",
      default: { name: "Alice", age: 20 },
    });

    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return (user as any).use("name");
    });

    expect(result.current).toBe("Alice");
    expect(renderCount).toBe(1);

    // Updating an unwatched key does not re-render.
    act(() => {
      user.change("age", 30);
    });
    expect(result.current).toBe("Alice");
    expect(renderCount).toBe(1);

    // Updating the watched key re-renders and returns the new value.
    act(() => {
      user.change("name", "Bob");
    });
    expect(result.current).toBe("Bob");
    expect(renderCount).toBe(2);
  });

  it("REGRESSION: returns the current value via state (not stale closure) after first update", () => {
    type User = { name: string };
    const user = atom<User>({
      key: "rx.use.no-closure",
      default: { name: "Alice" },
    });

    const { result } = renderHook(() => (user as any).use("name"));

    act(() => {
      user.change("name", "Bob");
    });
    expect(result.current).toBe("Bob");

    act(() => {
      user.change("name", "Carol");
    });
    expect(result.current).toBe("Carol");
  });
});

describe("React atom — useWatch", () => {
  it("invokes the callback on key change and unsubscribes on unmount", () => {
    type User = { age: number };
    const user = atom<User>({ key: "rx.useWatch.basic", default: { age: 0 } });

    const calls: Array<[number, number]> = [];
    const { unmount } = renderHook(() =>
      (user as any).useWatch("age", (newV: number, oldV: number) => {
        calls.push([oldV, newV]);
      })
    );

    act(() => {
      user.change("age", 1);
    });
    act(() => {
      user.change("age", 2);
    });

    expect(calls).toEqual([
      [0, 1],
      [1, 2],
    ]);

    unmount();
    act(() => {
      user.change("age", 99);
    });
    expect(calls).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });
});

describe("React atom — <Provider> action", () => {
  it("renders children and applies the provided value via effect", () => {
    const counter = atom({ key: "rx.Provider", default: 0 });
    const Provider = (counter as ReactAtom).Provider;

    render(<Provider value={42 as any}>child</Provider>);

    // Provider runs an effect after first paint that pushes the value in.
    expect(counter.value).toBe(42);
  });
});

describe("React atom — concurrent rendering safety", () => {
  it("does not tear: parallel reads of the same atom see the same value", () => {
    // Build a small consumer tree and verify two sibling subscribers always
    // agree on the current value across an update.
    const counter = atom({ key: "rx.no-tear", default: 0 });

    let leftSeen: number[] = [];
    let rightSeen: number[] = [];

    function Left() {
      const v = (counter as any).useValue();
      leftSeen.push(v);
      return <span data-testid="l">{v}</span>;
    }
    function Right() {
      const v = (counter as any).useValue();
      rightSeen.push(v);
      return <span data-testid="r">{v}</span>;
    }

    const { getByTestId } = render(
      <>
        <Left />
        <Right />
      </>
    );

    expect(getByTestId("l").textContent).toBe("0");
    expect(getByTestId("r").textContent).toBe("0");

    act(() => {
      counter.update(1);
    });

    expect(getByTestId("l").textContent).toBe("1");
    expect(getByTestId("r").textContent).toBe("1");

    // Last seen values should agree between siblings.
    expect(leftSeen.at(-1)).toBe(rightSeen.at(-1));
  });
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { atoms } from "@mongez/atom";
import { fetchingAtom, loadingAtom, openAtom } from "../helpers";
import { portalAtom } from "../portal-atom";

afterEach(() => {
  for (const key of Object.keys(atoms)) {
    atoms[key].destroy();
  }
});

describe("openAtom", () => {
  it("starts closed by default and toggles open/close", () => {
    const a = openAtom("helpers.open");
    expect(a.value).toBe(false);
    a.open();
    expect(a.value).toBe(true);
    a.close();
    expect(a.value).toBe(false);
    a.toggle();
    expect(a.value).toBe(true);
    a.toggle();
    expect(a.value).toBe(false);
  });

  it("useOpened subscribes and re-renders on change", () => {
    const a = openAtom("helpers.open.useOpened");
    const { result } = renderHook(() => a.useOpened());
    expect(result.current).toBe(false);
    act(() => a.open());
    expect(result.current).toBe(true);
  });
});

describe("loadingAtom", () => {
  it("startLoading / stopLoading / toggleLoading", () => {
    const a = loadingAtom("helpers.loading");
    expect(a.value).toBe(false);
    a.startLoading();
    expect(a.value).toBe(true);
    a.stopLoading();
    expect(a.value).toBe(false);
    a.toggleLoading();
    expect(a.value).toBe(true);
  });
});

describe("fetchingAtom", () => {
  it("default shape is { isLoading: true, data: null, error: undefined, pagination: undefined }", () => {
    const a = fetchingAtom("helpers.fetching.shape");
    expect(a.value).toEqual({
      isLoading: true,
      data: null,
      error: undefined,
      pagination: undefined,
    });
  });

  it("success() sets data and clears loading", () => {
    const a = fetchingAtom<{ id: number }[]>("helpers.fetching.success");
    a.success([{ id: 1 }], { page: 1 });
    expect(a.value.isLoading).toBe(false);
    expect(a.value.data).toEqual([{ id: 1 }]);
    expect(a.value.pagination).toEqual({ page: 1 });
  });

  it("failed() sets error and clears loading", () => {
    const a = fetchingAtom("helpers.fetching.failed");
    a.failed("bad");
    expect(a.value.isLoading).toBe(false);
    expect(a.value.error).toBe("bad");
  });

  it("append concatenates to existing data", () => {
    const a = fetchingAtom<number[]>("helpers.fetching.append", [1, 2]);
    a.append([3, 4] as any);
    expect(a.value.data).toEqual([1, 2, 3, 4]);
    expect(a.value.isLoading).toBe(false);
  });

  it("useLoading / useData hook subscribe to their respective keys", () => {
    const a = fetchingAtom<{ id: number }[]>("helpers.fetching.hooks");

    const { result: loading } = renderHook(() => a.useLoading());
    const { result: data } = renderHook(() => a.useData());

    expect(loading.current).toBe(true);
    expect(data.current).toBe(null);

    act(() => a.success([{ id: 1 }]));
    expect(loading.current).toBe(false);
    expect(data.current).toEqual([{ id: 1 }]);
  });
});

describe("portalAtom", () => {
  it("opens with data, closes, and toggles", () => {
    type Payload = { id: number };
    const p = portalAtom<Payload>("helpers.portal");

    expect(p.value.opened).toBe(false);
    p.open({ id: 1 });
    expect(p.value).toEqual({ opened: true, data: { id: 1 } });
    p.close();
    expect(p.value.opened).toBe(false);
    p.toggle({ id: 2 });
    expect(p.value).toEqual({ opened: true, data: { id: 2 } });
    p.toggle();
    expect(p.value.opened).toBe(false);
  });

  it("useOpened / useData hook into the keys", () => {
    type Payload = { id: number };
    const p = portalAtom<Payload>("helpers.portal.hooks");
    const { result: opened } = renderHook(() => p.useOpened());
    const { result: data } = renderHook(() => p.useData());

    expect(opened.current).toBe(false);
    act(() => p.open({ id: 7 }));
    expect(opened.current).toBe(true);
    expect(data.current).toEqual({ id: 7 });
  });
});

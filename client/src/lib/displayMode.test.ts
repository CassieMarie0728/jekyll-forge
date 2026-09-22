import { afterEach, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  applyDisplayMode,
  getDisplayMode,
  useDisplayMode,
} from "./displayMode";
afterEach(() => {
  localStorage.clear();
  document.head.innerHTML = "";
});
it("persists desktop mode, updates both controls, and restores a zoomable mobile viewport", () => {
  document.head.innerHTML =
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  const settings = renderHook(() => useDisplayMode());
  const menu = renderHook(() => useDisplayMode());
  act(() => settings.result.current[1]("desktop"));
  expect(getDisplayMode()).toBe("desktop");
  expect(menu.result.current[0]).toBe("desktop");
  expect(
    document.querySelector('meta[name="viewport"]')?.getAttribute("content")
  ).toBe("width=1280");
  applyDisplayMode(getDisplayMode());
  act(() => menu.result.current[1]("auto"));
  expect(settings.result.current[0]).toBe("auto");
  expect(
    document.querySelector('meta[name="viewport"]')?.getAttribute("content")
  ).toBe("width=device-width, initial-scale=1.0");
});

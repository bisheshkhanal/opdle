import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

const storageState = new Map<string, string>();

const storageMock: Storage = {
  getItem: (key) => storageState.get(key) ?? null,
  setItem: (key, value) => {
    storageState.set(key, value);
  },
  removeItem: (key) => {
    storageState.delete(key);
  },
  clear: () => {
    storageState.clear();
  },
  key: (index) => Array.from(storageState.keys())[index] ?? null,
  get length() {
    return storageState.size;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
  storageState.clear();
});

vi.mock("next/image", () => ({
  default: ({
    fill,
    ...props
  }: React.ComponentProps<"img"> & { fill?: boolean }) =>
    React.createElement("img", props),
}));

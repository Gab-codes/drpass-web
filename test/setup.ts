import "@testing-library/jest-dom/vitest";

window.matchMedia = () => ({
  matches: false,
  media: "",
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}

(globalThis as unknown as Record<string, unknown>).IntersectionObserver =
  MockIntersectionObserver;

class MockResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}

(globalThis as unknown as Record<string, unknown>).ResizeObserver =
  MockResizeObserver;

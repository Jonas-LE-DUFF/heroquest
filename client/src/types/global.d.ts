// src/types/global.d.ts

interface Window {
  setTimeout: (
    callback: (...args: unknown[]) => void,
    ms: number,
    ...args: unknown[]
  ) => number;
  clearTimeout: (id: number) => void;
  requestAnimationFrame: (
    callback: (time: window.DOMHighResTimestamp) => void,
  ) => number;
  cancelAnimationFrame: (id: number) => void;
}

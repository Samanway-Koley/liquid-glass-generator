/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*?url" {
  const url: string;
  export default url;
}

interface Window {
  LiquidGlass?: {
    init: (root?: ParentNode) => void;
    refresh: (el?: HTMLElement) => void;
    destroy: (el: HTMLElement) => void;
    set: (el: HTMLElement, opts: Record<string, unknown>) => void;
    get: (el: HTMLElement) => Record<string, unknown>;
    supported: boolean;
    version: string;
    defaults: Record<string, unknown>;
  };
  jQuery?: unknown;
}

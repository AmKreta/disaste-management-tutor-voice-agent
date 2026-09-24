/// <reference types="vite/client" />

import type { PipecatClient } from "@pipecat-ai/client-js";

declare global {
  interface Window {
    pcClient?: PipecatClient;
  }
}

export {};

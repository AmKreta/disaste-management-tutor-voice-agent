import { create } from "zustand";
import { AiConnectionStatus, LogKind, type LogEntry } from "../types";

type AiStateStoreType = {
  status: AiConnectionStatus;
  logs: LogEntry[];
  setStatus: (status: AiConnectionStatus) => void;
  addLog: (message: string, kind?: LogKind) => void;
  clearLogs: () => void;
};

function inferKind(message: string): LogKind {
  if (message.startsWith("User: ")) return LogKind.USER;
  if (message.startsWith("Bot: ")) return LogKind.BOT;
  if (message.startsWith("Status: ")) return LogKind.STATUS;
  return LogKind.INFO;
}

export const useAiStateStore = create<AiStateStoreType>((set) => ({
  status: AiConnectionStatus.DISCONNECTED,
  logs: [],
  setStatus: (status) => set({ status }),
  addLog: (message, kind) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `${Date.now()}-${state.logs.length}`,
          message,
          timestamp: new Date().toISOString(),
          kind: kind ?? inferKind(message),
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));

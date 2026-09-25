import { create } from "zustand";
import { AiConnectionStatus, LogKind, type LogEntry } from "../types";

type AiStateStoreType = {
  status: AiConnectionStatus;
  chat: LogEntry[];
  logs: LogEntry[];
  setStatus: (status: AiConnectionStatus) => void;
  addLog: (message: string, kind?: LogKind) => void;
  addChatMessage: (message: string, kind?: LogKind) => void;
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
  chat: [],
  logs: [],
  setStatus: (status) => set({ status }),
  addChatMessage: (message, kind) =>
    set((state) => ({
      chat: [...state.chat, {
        id: `${Date.now()}-${state.chat.length}`,
        message,
        timestamp: new Date().toISOString(),
        kind: kind ?? inferKind(message),
      }],
    })),
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

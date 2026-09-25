import { create } from "zustand";
import {
  AiConnectionStatus,
  LogKind,
  type LogEntry,
  type VoiceSpeaker,
} from "../types";

type AiStateStoreType = {
  status: AiConnectionStatus;
  speaker: VoiceSpeaker;
  chat: LogEntry[];
  logs: LogEntry[];
  setStatus: (status: AiConnectionStatus) => void;
  setSpeaker: (speaker: VoiceSpeaker) => void;
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
  speaker: null,
  chat: [],
  logs: [],
  setStatus: (status) =>
    set((state) => ({
      status,
      speaker:
        status === AiConnectionStatus.CONNECTED ? state.speaker : null,
    })),
  setSpeaker: (speaker) => set({ speaker }),
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

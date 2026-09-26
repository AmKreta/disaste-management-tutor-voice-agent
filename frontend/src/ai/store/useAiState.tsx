import { create } from "zustand";
import {
  AiConnectionStatus,
  LogKind,
  type LogEntry,
  type VoiceSpeaker,
} from "../types";

export type ChatUpdateMode = "append" | "replace" | "final" | "finish";

type AiStateStoreType = {
  status: AiConnectionStatus;
  speaker: VoiceSpeaker;
  selectedVoice: string;
  chat: LogEntry[];
  streamingChatIds: Partial<Record<LogKind, string>>;
  logs: LogEntry[];
  setStatus: (status: AiConnectionStatus) => void;
  setSpeaker: (speaker: VoiceSpeaker) => void;
  setSelectedVoice: (voiceId: string) => void;
  addLog: (message: string, kind?: LogKind) => void;
  addChatMessage: (message: string, kind?: LogKind, mode?: ChatUpdateMode) => void;
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
  selectedVoice: "alloy",
  chat: [],
  streamingChatIds: {},
  logs: [],
  setStatus: (status) =>
    set((state) => ({
      status,
      speaker:
        status === AiConnectionStatus.CONNECTED ? state.speaker : null,
    })),
  setSpeaker: (speaker) => set({ speaker }),
  setSelectedVoice: (selectedVoice) => set({ selectedVoice }),
  addChatMessage: (message, kind, mode) =>
    set((state) => {
      const entryKind = kind ?? inferKind(message);
      const activeId = state.streamingChatIds[entryKind];

      if (mode === "finish") {
        const streamingChatIds = { ...state.streamingChatIds };
        delete streamingChatIds[entryKind];
        return { streamingChatIds };
      }

      if (mode && mode !== "finish") {
        if (activeId) {
          const chat = state.chat.map((entry) => {
            if (entry.id !== activeId) return entry;
            const updatedText = mode === "append"
              ? appendText(entry.message, message)
              : message;
            return { ...entry, message: updatedText, timestamp: new Date().toISOString() };
          });
          const streamingChatIds = { ...state.streamingChatIds };
          if (mode === "final") delete streamingChatIds[entryKind];
          return { chat, streamingChatIds };
        }

        if (!message) return {};
        const id = `${Date.now()}-${state.chat.length}`;
        const chat = [...state.chat, {
          id,
          message,
          timestamp: new Date().toISOString(),
          kind: entryKind,
        }];
        const streamingChatIds = { ...state.streamingChatIds };
        if (mode !== "final") streamingChatIds[entryKind] = id;
        return { chat, streamingChatIds };
      }

      return {
        chat: [...state.chat, {
          id: `${Date.now()}-${state.chat.length}`,
          message,
          timestamp: new Date().toISOString(),
          kind: entryKind,
        }],
      };
    }),
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

function appendText(current: string, next: string): string {
  if (!current) return next;
  const left = current.slice(-1);
  const right = next.slice(0, 1);
  const needsSpace = /[\p{L}\p{N}]$/u.test(left) && /[\p{L}\p{N}]/u.test(right);
  return `${current}${needsSpace ? " " : ""}${next}`;
}

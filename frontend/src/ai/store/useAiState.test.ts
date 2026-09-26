import { afterEach, describe, expect, it } from "vitest";
import { LogKind } from "../types";
import { useAiStateStore } from "./useAiState";

afterEach(() => {
  useAiStateStore.setState({ chat: [], streamingChatIds: {}, logs: [] });
});

describe("streaming chat updates", () => {
  it("appends partial text to one chat entry and finalizes it", () => {
    const { addChatMessage } = useAiStateStore.getState();

    addChatMessage("Natural disasters", LogKind.BOT, "append");
    addChatMessage("can happen suddenly.", LogKind.BOT, "append");
    addChatMessage("Natural disasters can happen suddenly.", LogKind.BOT, "final");

    const state = useAiStateStore.getState();
    expect(state.chat).toHaveLength(1);
    expect(state.chat[0].message).toBe("Natural disasters can happen suddenly.");
    expect(state.chat[0].kind).toBe(LogKind.BOT);
    expect(state.streamingChatIds[LogKind.BOT]).toBeUndefined();
  });

  it("replaces interim text and supports explicitly finishing a stream", () => {
    const { addChatMessage } = useAiStateStore.getState();

    addChatMessage("Draft", LogKind.BOT, "append");
    addChatMessage("Corrected draft", LogKind.BOT, "replace");
    const activeId = useAiStateStore.getState().streamingChatIds[LogKind.BOT];
    addChatMessage("", LogKind.BOT, "finish");

    const state = useAiStateStore.getState();
    expect(state.chat).toHaveLength(1);
    expect(state.chat[0].message).toBe("Corrected draft");
    expect(state.streamingChatIds[LogKind.BOT]).toBeUndefined();
    expect(activeId).toBe(state.chat[0].id);
  });
});

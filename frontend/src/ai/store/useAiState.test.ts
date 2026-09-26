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

  it("adds spaces when streamed chunks start after sentence punctuation", () => {
    const { addChatMessage } = useAiStateStore.getState();

    addChatMessage("Hello!", LogKind.BOT, "append");
    addChatMessage("Today, we're exploring natural disasters.", LogKind.BOT, "append");
    addChatMessage("We'll look at what they are.", LogKind.BOT, "append");

    expect(useAiStateStore.getState().chat[0].message).toBe(
      "Hello! Today, we're exploring natural disasters. We'll look at what they are."
    );
  });

  it("does not insert spaces inside decimals or when the next chunk has one", () => {
    const { addChatMessage } = useAiStateStore.getState();

    addChatMessage("The value is 3.", LogKind.BOT, "append");
    addChatMessage("14. Next value:", LogKind.BOT, "append");
    addChatMessage(" 2.7.", LogKind.BOT, "append");

    expect(useAiStateStore.getState().chat[0].message).toBe(
      "The value is 3.14. Next value: 2.7."
    );
  });
});

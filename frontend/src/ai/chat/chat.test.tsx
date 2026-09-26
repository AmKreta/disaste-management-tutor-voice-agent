import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Chat } from "./chat";
import { useAiStateStore } from "../store/useAiState";
import { AiConnectionStatus, LogKind } from "../types";

vi.mock("../../ui/sineOrb", () => ({ SineOrb: () => <div data-testid="sine-orb" /> }));
vi.mock("../debugInfo", () => ({ DebugInfo: () => <div>Debug panel</div> }));
vi.mock("./chatInput", () => ({ ChatInput: () => <div>Chat controls</div> }));
vi.mock("./voiceSettings", () => ({ VoiceSettings: () => <div>Voice settings</div> }));

describe("Chat", () => {
  beforeEach(() => useAiStateStore.setState({
    chat: [], streamingChatIds: {}, status: AiConnectionStatus.DISCONNECTED, speaker: null,
  }));

  it("shows the empty guidance and disconnected voice settings", () => {
    render(<Chat />);
    expect(screen.getByText("Tap the mic to start talking with the tutor.")).toBeInTheDocument();
    expect(screen.getByText("Voice settings")).toBeInTheDocument();
    expect(screen.queryByTestId("sine-orb")).not.toBeInTheDocument();
  });

  it("shows only user and tutor chat messages and the connected orb", () => {
    useAiStateStore.setState({
      status: AiConnectionStatus.CONNECTED,
      speaker: LogKind.BOT,
      chat: [
        { id: "status", message: "Status: Connected", timestamp: "2026-09-26T08:40:00Z", kind: LogKind.STATUS },
        { id: "user", message: "What causes earthquakes?", timestamp: "2026-09-26T08:40:01Z", kind: LogKind.USER },
        { id: "bot", message: "Tectonic plates move.", timestamp: "2026-09-26T08:40:02Z", kind: LogKind.BOT },
      ],
    });
    render(<Chat />);
    expect(screen.getByText("What causes earthquakes?")).toBeInTheDocument();
    expect(screen.getByText("Tectonic plates move.")).toBeInTheDocument();
    expect(screen.queryByText("Status: Connected")).not.toBeInTheDocument();
    expect(screen.getByTestId("sine-orb")).toBeInTheDocument();
    expect(screen.queryByText("Voice settings")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebugInfo } from "./debugInfo";
import { ChatInput } from "./chat/chatInput";
import { VoiceSettings } from "./chat/voiceSettings";
import { useAiStateStore } from "./store/useAiState";
import { AiConnectionStatus, LogKind } from "./types";

const context = vi.hoisted(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
const voiceApi = vi.hoisted(() => ({ fetchVoices: vi.fn() }));
vi.mock("./store/useAiContext", () => ({ useAiContext: () => context }));
vi.mock("../service/voiceApi", () => voiceApi);

describe("ChatInput", () => {
  beforeEach(() => {
    context.connect.mockReset();
    context.disconnect.mockReset();
    useAiStateStore.setState({ status: AiConnectionStatus.DISCONNECTED });
  });

  it("connects, disconnects, and disables the microphone while connecting", () => {
    const { rerender } = render(<ChatInput debugOpen={false} onToggleDebug={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(context.connect).toHaveBeenCalledOnce();

    useAiStateStore.getState().setStatus(AiConnectionStatus.CONNECTED);
    rerender(<ChatInput debugOpen={false} onToggleDebug={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(context.disconnect).toHaveBeenCalledOnce();

    useAiStateStore.getState().setStatus(AiConnectionStatus.CONNECTING);
    rerender(<ChatInput debugOpen={false} onToggleDebug={() => {}} />);
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("toggles debug from the debug button", () => {
    const onToggleDebug = vi.fn();
    render(<ChatInput debugOpen onToggleDebug={onToggleDebug} />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle debug logs" }));
    expect(onToggleDebug).toHaveBeenCalledOnce();
  });
});

describe("VoiceSettings", () => {
  beforeEach(() => {
    voiceApi.fetchVoices.mockReset();
    voiceApi.fetchVoices.mockResolvedValue([
      { id: "alloy", name: "Alloy" },
      { id: "nova", name: "Nova" },
    ]);
    useAiStateStore.setState({ selectedVoice: "alloy" });
  });

  it("loads available voices and updates the selected voice", async () => {
    render(<VoiceSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const select = await screen.findByRole("combobox", { name: "Voice" });
    expect(select).toHaveValue("alloy");
    fireEvent.change(select, { target: { value: "nova" } });
    expect(useAiStateStore.getState().selectedVoice).toBe("nova");
  });

  it("reports a voice loading error", async () => {
    voiceApi.fetchVoices.mockRejectedValue(new Error("unavailable"));
    render(<VoiceSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    await waitFor(() => expect(document.body).toHaveTextContent("Could not load voices."));
  });
});

describe("DebugInfo", () => {
  beforeEach(() => useAiStateStore.setState({ logs: [] }));

  it("shows a useful empty state and current debug logs", () => {
    const { rerender } = render(<DebugInfo />);
    expect(screen.getByText("Debug Info")).toBeInTheDocument();
    expect(screen.getByText("No status logs yet.")).toBeInTheDocument();
    useAiStateStore.getState().addLog("Status: Connected", LogKind.STATUS);
    rerender(<DebugInfo compact />);
    expect(screen.getByText(/Status: Connected/)).toBeInTheDocument();
  });
});

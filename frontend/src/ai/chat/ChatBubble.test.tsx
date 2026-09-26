import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatBubble } from "./chaBubble";
import { LogKind } from "../types";

describe("ChatBubble", () => {
  it("labels a tutor message and displays its text", () => {
    render(
      <ChatBubble
        entry={{
          id: "tutor-1",
          message: "Earthquakes happen when tectonic plates move.",
          timestamp: "2026-09-26T08:40:00.000Z",
          kind: LogKind.BOT,
        }}
      />
    );

    expect(screen.getByText("Earthquakes happen when tectonic plates move.")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("does not render an empty message or its avatar", () => {
    const { container } = render(
      <ChatBubble
        entry={{
          id: "empty-tutor",
          message: "",
          timestamp: "2026-09-26T08:40:00.000Z",
          kind: LogKind.BOT,
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("reveals a streaming tutor message with animation frames while speaking", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const entry = {
      id: "tutor-stream",
      message: "Hello world",
      timestamp: "2026-09-26T08:40:00.000Z",
      kind: LogKind.BOT,
    };
    const { container, rerender } = render(
      <ChatBubble entry={entry} isStreaming />
    );

    expect(container.querySelector('[aria-label="Hello world"]')).toBeNull();
    rerender(<ChatBubble entry={entry} isStreaming isSpeaking />);
    act(() => frames.shift()?.(performance.now() + 100));
    expect(container.querySelector('[aria-label="Hello world"]')).toHaveTextContent("H");
  });
});

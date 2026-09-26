import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./service/pipecatSession", () => ({ PipecatSession: class {} }));
vi.mock("./ai/chat/voiceSettings", () => ({ VoiceSettings: () => null }));

describe("App", () => {
  it("renders the tutor chat inside the app provider", () => {
    render(<App />);
    expect(screen.getByText("Tap the mic to start talking with the tutor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});

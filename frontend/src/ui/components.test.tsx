import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Logs } from "./log";
import { SineOrb } from "./sineOrb";
import { Status, StatusTone } from "./status";
import { Tooltip } from "./tooltip";
import { LogKind } from "../ai/types";

describe("Avatar", () => {
  it("shows the first initial or the role fallback", () => {
    const { rerender } = render(<Avatar kind={LogKind.BOT} name="Tutor" />);
    expect(screen.getByText("T")).toBeInTheDocument();
    rerender(<Avatar kind={LogKind.USER} />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });
});

describe("Button", () => {
  it("forwards click events and disabled state", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick} variant="connect">Connect</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<Button disabled>Unavailable</Button>);
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });
});

describe("Status", () => {
  it("renders its indicator and optional tooltip content", () => {
    const { container } = render(<Status tone={StatusTone.Success} label="Transport" value="Connected" activity />);
    expect(container.querySelector("span")).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Transport: Connected");
  });
});

describe("Tooltip", () => {
  it("wraps its child when text is provided and skips the portal when empty", () => {
    const { rerender, container } = render(<Tooltip text="Hint"><button>Target</button></Tooltip>);
    expect(screen.getByRole("button", { name: "Target" })).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Hint");
    rerender(<Tooltip text=""><span>Plain</span></Tooltip>);
    expect(container.querySelector("span")).toHaveTextContent("Plain");
    expect(document.body).not.toHaveTextContent("Hint");
  });
});

describe("Logs", () => {
  it("shows the empty state and renders log entries", () => {
    const { rerender } = render(<Logs entries={[]} />);
    expect(screen.getByText("No status logs yet.")).toBeInTheDocument();
    rerender(<Logs entries={[{ id: "1", message: "Status: Connected", timestamp: "2026-09-26T08:40:00Z", kind: LogKind.STATUS }]} compact />);
    expect(screen.getByText(/Status: Connected/)).toBeInTheDocument();
  });
});

describe("SineOrb", () => {
  it("draws to its canvas and cancels animation on unmount", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const context = {
      setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), beginPath: vi.fn(),
      arc: vi.fn(), clip: vi.fn(), fillRect: vi.fn(), stroke: vi.fn(), restore: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const { unmount, container } = render(<SineOrb speaker={LogKind.BOT} />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
    unmount();
    expect(cancel).toHaveBeenCalledWith(1);
  });
});

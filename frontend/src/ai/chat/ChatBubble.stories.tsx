import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatBubble } from "./chaBubble";
import { LogKind, type LogEntry } from "../types";

const meta = {
  title: "Chat/Chat bubble",
  component: ChatBubble,
  args: {
    entry: {
      id: "message-1",
      message: "Natural disasters can affect people and the environment.",
      timestamp: "2026-09-26T08:40:00.000Z",
      kind: LogKind.BOT,
    } satisfies LogEntry,
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tutor: Story = {};

export const Student: Story = {
  args: {
    entry: {
      id: "message-2",
      message: "What causes earthquakes?",
      timestamp: "2026-09-26T08:41:00.000Z",
      kind: LogKind.USER,
    },
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Logs } from ".";
import { LogKind, type LogEntry } from "../../ai/types";

const entries: LogEntry[] = [
  { id: "1", message: "Status: Connected", timestamp: "2026-09-26T08:40:00Z", kind: LogKind.STATUS },
  { id: "2", message: "User: What causes earthquakes?", timestamp: "2026-09-26T08:40:05Z", kind: LogKind.USER },
  { id: "3", message: "Bot: Tectonic plates move along faults.", timestamp: "2026-09-26T08:40:08Z", kind: LogKind.BOT },
];
const meta = { title: "UI/Logs", component: Logs, args: { entries } } satisfies Meta<typeof Logs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };
export const Empty: Story = { args: { entries: [] } };

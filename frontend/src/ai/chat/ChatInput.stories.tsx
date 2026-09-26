import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AiProvider } from "../store/useAiContext";
import { useAiStateStore } from "../store/useAiState";
import { AiConnectionStatus } from "../types";
import { ChatInput } from "./chatInput";

function InputPreview({ status }: { status: AiConnectionStatus }) {
  const setStatus = useAiStateStore((state) => state.setStatus);
  useEffect(() => setStatus(status), [setStatus, status]);
  return <AiProvider><ChatInput debugOpen={false} onToggleDebug={() => {}} /></AiProvider>;
}
const meta = { title: "Chat/Chat input", component: InputPreview } satisfies Meta<typeof InputPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Disconnected: Story = { args: { status: AiConnectionStatus.DISCONNECTED } };
export const Connected: Story = { args: { status: AiConnectionStatus.CONNECTED } };
export const Connecting: Story = { args: { status: AiConnectionStatus.CONNECTING } };

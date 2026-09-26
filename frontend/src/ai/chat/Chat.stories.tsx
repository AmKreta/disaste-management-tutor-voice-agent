import type { Meta, StoryObj } from "@storybook/react-vite";
import { AiProvider } from "../store/useAiContext";
import { Chat } from "./chat";

const meta = {
  title: "Chat/Conversation",
  component: Chat,
  decorators: [(Story) => <AiProvider><Story /></AiProvider>],
} satisfies Meta<typeof Chat>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};

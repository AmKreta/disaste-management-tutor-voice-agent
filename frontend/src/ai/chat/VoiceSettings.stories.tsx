import type { Meta, StoryObj } from "@storybook/react-vite";
import { VoiceSettings } from "./voiceSettings";

const meta = { title: "Chat/Voice settings", component: VoiceSettings } satisfies Meta<typeof VoiceSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open settings" }));
  },
};

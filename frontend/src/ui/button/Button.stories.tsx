import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from ".";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Connect" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Connect: Story = { args: { variant: "connect" } };
export const Disconnect: Story = {
  args: { children: "Disconnect", variant: "disconnect" },
};
export const Disabled: Story = { args: { disabled: true } };

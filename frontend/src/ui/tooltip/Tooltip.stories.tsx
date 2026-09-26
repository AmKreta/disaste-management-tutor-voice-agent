import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from ".";

const meta = { title: "UI/Tooltip", component: Tooltip, args: { text: "Helpful context" } } satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { children: <button type="button">Hover or focus me</button> } };
export const WithoutText: Story = { args: { text: "", children: <span>No tooltip</span> } };

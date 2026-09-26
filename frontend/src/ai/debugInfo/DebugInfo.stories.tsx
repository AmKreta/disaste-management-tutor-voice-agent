import type { Meta, StoryObj } from "@storybook/react-vite";
import { DebugInfo } from ".";

const meta = { title: "Debug/Debug info", component: DebugInfo } satisfies Meta<typeof DebugInfo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };

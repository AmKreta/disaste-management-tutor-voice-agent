import type { Meta, StoryObj } from "@storybook/react-vite";
import { Status, StatusTone } from ".";

const meta = { title: "UI/Status", component: Status } satisfies Meta<typeof Status>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Connected: Story = { args: { tone: StatusTone.Success, label: "Transport", value: "Connected" } };
export const Disconnected: Story = { args: { tone: StatusTone.Idle, label: "Transport", value: "Disconnected" } };
export const Connecting: Story = { args: { tone: StatusTone.Idle, label: "Transport", value: "Connecting", activity: true } };

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from ".";
import { LogKind } from "../../ai/types";

const meta = { title: "UI/Avatar", component: Avatar } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = { args: { kind: LogKind.BOT, name: "Tutor" } };
export const Student: Story = { args: { kind: LogKind.USER, name: "You" } };

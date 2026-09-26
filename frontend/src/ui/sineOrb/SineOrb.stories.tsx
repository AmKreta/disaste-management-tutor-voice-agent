import type { Meta, StoryObj } from "@storybook/react-vite";
import { SineOrb } from ".";
import { LogKind } from "../../ai/types";

const meta = { title: "UI/Sine orb", component: SineOrb } satisfies Meta<typeof SineOrb>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Idle: Story = { args: { speaker: null } };
export const TutorSpeaking: Story = { args: { speaker: LogKind.BOT } };
export const StudentSpeaking: Story = { args: { speaker: LogKind.USER } };

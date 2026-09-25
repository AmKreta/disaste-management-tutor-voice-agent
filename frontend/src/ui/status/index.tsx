import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useMemo } from "react";
import { Tooltip } from "../tooltip";

export enum StatusTone {
  Success = "green",
  Idle = "grey",
}

type StatusProps = {
  activity?: boolean;
  label?: string;
  value?: string;
  tone: StatusTone;
};

const TONE: Record<StatusTone, { ring: string; core: string }> = {
  [StatusTone.Success]: { ring: "#c8e6c9", core: "#4caf50" },
  [StatusTone.Idle]: { ring: "#e0e0e0", core: "#9e9e9e" },
};

const heartbeat = keyframes`
  0%, 28%, 70%, 100% {
    transform: scale(1);
  }
  14%, 42% {
    transform: scale(1.28);
  }
`;

const Dot = styled.span<{ $tone: StatusTone; $activity?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${({ $tone }) => TONE[$tone].ring};
  transform: scale(1);
  animation: ${({ $activity }) =>
    $activity ? `${heartbeat} 1.15s ease-in-out infinite` : "none"};

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ $tone }) => TONE[$tone].core};
  }
`;

function tooltipTextFor(
  label: string | undefined,
  value: string | undefined
): string {
  if (label && value) {
    return `${label}: ${value}`;
  }
  if (label) {
    return label;
  }
  if (value) {
    return value;
  }
  return "";
}

export function Status({ tone, label, value, activity }: StatusProps) {
  const tooltipText = useMemo(
    () => tooltipTextFor(label, value),
    [label, value]
  );

  const dot = <Dot $tone={tone} $activity={activity} />;

  if (!tooltipText) {
    return dot;
  }

  return <Tooltip text={tooltipText}>{dot}</Tooltip>;
}

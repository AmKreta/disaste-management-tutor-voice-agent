import styled from "@emotion/styled";
import { LogKind } from "../../ai/types";

type AvatarProps = {
  kind: LogKind.USER | LogKind.BOT;
  name?: string;
};

const COLORS: Record<LogKind.USER | LogKind.BOT, { bg: string; fg: string }> = {
  [LogKind.USER]: { bg: "#bbdefb", fg: "#1565c0" },
  [LogKind.BOT]: { bg: "#c8e6c9", fg: "#2e7d32" },
};

const Face = styled.span<{ $kind: LogKind.USER | LogKind.BOT }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ $kind }) => COLORS[$kind].bg};
  color: ${({ $kind }) => COLORS[$kind].fg};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

export function Avatar({ kind, name }: AvatarProps) {
  const initials = name?.trim().charAt(0).toUpperCase() ?? (kind === LogKind.USER ? "U" : "B");

  return <Face $kind={kind}>{initials}</Face>;
}

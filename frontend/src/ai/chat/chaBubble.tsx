import styled from "@emotion/styled";
import { Avatar } from "../../ui/avatar";
import { formatDateTime } from "../../utils/formatDateTime";
import { LogKind, type LogEntry } from "../types";

type ChatBubbleProps = {
  entry: LogEntry;
};

const Row = styled.div<{ $mine: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  justify-content: ${({ $mine }) => ($mine ? "flex-end" : "flex-start")};
`;

const Column = styled.div<{ $mine: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $mine }) => ($mine ? "flex-end" : "flex-start")};
  max-width: min(72%, 440px);
`;

const Bubble = styled.div<{ $mine: boolean }>`
  padding: 10px 14px;
  border-radius: ${({ $mine }) =>
    $mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
  background-color: ${({ $mine }) => ($mine ? "#e3f2fd" : "#f1f8e9")};
  color: #222;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
`;

const Time = styled.time`
  margin-top: 4px;
  font-size: 11px;
  color: #888;
`;

export function ChatBubble({ entry }: ChatBubbleProps) {
  const mine = entry.kind === LogKind.USER;
  const name = mine ? "You" : "Tutor";

  return (
    <Row $mine={mine}>
      {!mine && <Avatar kind={LogKind.BOT} name={name} />}
      <Column $mine={mine}>
        <Bubble $mine={mine}>{entry.message}</Bubble>
        <Time dateTime={entry.timestamp}>{formatDateTime(entry.timestamp)}</Time>
      </Column>
      {mine && <Avatar kind={LogKind.USER} name={name} />}
    </Row>
  );
}

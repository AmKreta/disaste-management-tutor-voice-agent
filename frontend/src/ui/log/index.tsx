import styled from "@emotion/styled";
import { useEffect, useRef } from "react";
import { formatDateTime } from "../../utils/formatDateTime";
import { LogKind, type LogEntry } from "../../ai/types";

type LogsProps = {
  entries: LogEntry[];
  compact?: boolean;
};

const logColor: Partial<Record<LogKind, string>> = {
  [LogKind.USER]: "#2196F3",
  [LogKind.BOT]: "#4CAF50",
};

const LogScroller = styled.div<{ $compact?: boolean }>`
  height: ${({ $compact }) => ($compact ? "220px" : "500px")};
  overflow-y: auto;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
`;

const LogLine = styled.div<{ $kind: LogKind }>`
  color: ${({ $kind }) => logColor[$kind] ?? "inherit"};
`;

export function Logs({ entries, compact }: LogsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [entries]);

  return (
    <LogScroller ref={scrollerRef} $compact={compact}>
      {entries.length === 0 ? (
        <LogLine $kind={LogKind.INFO}>No status logs yet.</LogLine>
      ) : (
        entries.map((entry) => (
          <LogLine key={entry.id} $kind={entry.kind}>
            {formatDateTime(entry.timestamp)} - {entry.message}
          </LogLine>
        ))
      )}
    </LogScroller>
  );
}

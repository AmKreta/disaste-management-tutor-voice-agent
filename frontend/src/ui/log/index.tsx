import styled from "@emotion/styled";
import { useEffect, useRef } from "react";
import type { LogEntry, LogKind } from "../../ai/types";

type LogsProps = {
  entries: LogEntry[];
};

const logColor: Partial<Record<LogKind, string>> = {
  user: "#2196F3",
  bot: "#4CAF50",
};

const LogScroller = styled.div`
  height: 500px;
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

export function Logs({ entries }: LogsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [entries]);

  return (
    <LogScroller ref={scrollerRef}>
      {entries.map((entry) => (
        <LogLine key={entry.id} $kind={entry.kind}>
          {entry.timestamp} - {entry.message}
        </LogLine>
      ))}
    </LogScroller>
  );
}

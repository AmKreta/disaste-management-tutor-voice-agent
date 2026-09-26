import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../../ui/avatar";
import { formatDateTime } from "../../utils/formatDateTime";
import { LogKind, type LogEntry } from "../types";

type ChatBubbleProps = {
  entry: LogEntry;
  isSpeaking?: boolean;
  isStreaming?: boolean;
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

export function ChatBubble({
  entry,
  isSpeaking = false,
  isStreaming = false,
}: ChatBubbleProps) {
  const mine = entry.kind === LogKind.USER;
  const name = mine ? "You" : "Tutor";
  const textRef = useRef(entry.message);
  const [visibleLength, setVisibleLength] = useState(
    isStreaming && !mine ? 0 : Array.from(entry.message).length
  );
  const visibleLengthRef = useRef(visibleLength);
  textRef.current = entry.message;
  visibleLengthRef.current = visibleLength;

  useEffect(() => {
    if (mine || !isStreaming) {
      const fullLength = Array.from(textRef.current).length;
      visibleLengthRef.current = fullLength;
      setVisibleLength(fullLength);
      return;
    }

    if (!isSpeaking) return;

    let frame = 0;
    let previousTime = performance.now();
    let fractionalCharacters = 0;
    const animate = (time: number) => {
      const elapsed = Math.min(time - previousTime, 100);
      previousTime = time;
      // Natural speech averages roughly 15 visible characters per second.
      fractionalCharacters += elapsed * 0.015;
      const nextCharacters = Math.floor(fractionalCharacters);
      if (nextCharacters > 0) {
        fractionalCharacters -= nextCharacters;
        const fullLength = Array.from(textRef.current).length;
        const updatedLength = Math.min(
          visibleLengthRef.current + nextCharacters,
          fullLength
        );
        if (updatedLength !== visibleLengthRef.current) {
          visibleLengthRef.current = updatedLength;
          setVisibleLength(updatedLength);
        }
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isSpeaking, isStreaming, mine]);

  const visibleMessage = mine || !isStreaming
    ? entry.message
    : Array.from(entry.message).slice(0, visibleLength).join("");

  if (!visibleMessage.trim()) return null;

  return (
    <Row $mine={mine}>
      {!mine && <Avatar kind={LogKind.BOT} name={name} />}
      <Column $mine={mine}>
        <Bubble $mine={mine} aria-label={entry.message}>{visibleMessage}</Bubble>
        <Time dateTime={entry.timestamp}>{formatDateTime(entry.timestamp)}</Time>
      </Column>
      {mine && <Avatar kind={LogKind.USER} name={name} />}
    </Row>
  );
}

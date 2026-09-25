import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { DebugInfo } from "../debugInfo";
import { useAiStateStore } from "../store/useAiState";
import { LogKind } from "../types";
import { ChatBubble } from "./chaBubble";
import { ChatInput } from "./chatInput";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - 40px);
  max-width: 720px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
`;

const Window = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 16px;
  background-color: #fafafa;
`;

const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Empty = styled.p`
  margin: 48px 0 0;
  text-align: center;
  color: #9e9e9e;
  font-size: 14px;
`;

const DebugOverlay = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 76px;
  z-index: 2;
  max-height: 45%;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

export function Chat() {
  const chat = useAiStateStore((state) => state.chat);
  const [debugOpen, setDebugOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const messages = chat.filter(
    (entry) => entry.kind === LogKind.USER || entry.kind === LogKind.BOT
  );

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  return (
    <Shell>
      <Window ref={scrollerRef}>
        {messages.length === 0 ? (
          <Empty>Tap the mic to start talking with the tutor.</Empty>
        ) : (
          <Thread>
            {messages.map((entry) => (
              <ChatBubble key={entry.id} entry={entry} />
            ))}
          </Thread>
        )}
      </Window>
      {debugOpen && (
        <DebugOverlay>
          <DebugInfo compact />
        </DebugOverlay>
      )}
      <ChatInput
        debugOpen={debugOpen}
        onToggleDebug={() => setDebugOpen((open) => !open)}
      />
    </Shell>
  );
}

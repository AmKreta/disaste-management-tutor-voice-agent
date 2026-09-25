import styled from "@emotion/styled";
import { Logs } from "../../ui/log";
import { useAiStateStore } from "../store/useAiState";

const Panel = styled.div<{ $compact?: boolean }>`
  background-color: #fff;
  border-radius: ${({ $compact }) => ($compact ? "10px" : "8px")};
  padding: ${({ $compact }) => ($compact ? "12px" : "20px")};
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: bold;
`;

export function DebugInfo({ compact = false }: { compact?: boolean }) {
  const logs = useAiStateStore((state) => state.logs);

  return (
    <Panel $compact={compact}>
      <Title>Debug Info</Title>
      <Logs entries={logs} compact={compact} />
    </Panel>
  );
}

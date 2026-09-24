import styled from "@emotion/styled";
import { Logs } from "../../ui/log";
import { useAiStateStore } from "../store/useAiState";

const Panel = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: bold;
`;

export function DebugInfo() {
  const logs = useAiStateStore((state) => state.logs);

  return (
    <Panel>
      <Title>Debug Info</Title>
      <Logs entries={logs} />
    </Panel>
  );
}

import styled from "@emotion/styled";
import { Button } from "../../ui/button";
import { Status } from "../../ui/status";
import { useAiContext } from "../store/useAiContext";
import { useAiStateStore } from "../store/useAiState";
import { AiConnectionStatus, AI_STATUS_LABEL } from "../types";

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
`;

export function ChatHeader() {
  const status = useAiStateStore((state) => state.status);
  const { connect, disconnect } = useAiContext();

  const isConnected = status === AiConnectionStatus.CONNECTED;
  const isBusy =
    status === AiConnectionStatus.CONNECTING ||
    status === AiConnectionStatus.DISCONNECTING;

  return (
    <HeaderBar>
      <Status value={AI_STATUS_LABEL[status]} />
      <div>
        <Button
          variant="connect"
          onClick={connect}
          disabled={isConnected || isBusy}
        >
          Connect
        </Button>
        <Button
          variant="disconnect"
          onClick={disconnect}
          disabled={!isConnected || isBusy}
        >
          Disconnect
        </Button>
      </div>
    </HeaderBar>
  );
}

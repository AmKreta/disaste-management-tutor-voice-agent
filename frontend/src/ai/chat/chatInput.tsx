import styled from "@emotion/styled";
import { Status, StatusTone } from "../../ui/status";
import { Tooltip } from "../../ui/tooltip";
import { useAiContext } from "../store/useAiContext";
import { useAiStateStore } from "../store/useAiState";
import { AiConnectionStatus, AI_STATUS_LABEL } from "../types";

type ChatInputProps = {
  debugOpen: boolean;
  onToggleDebug: () => void;
};

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #eee;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: ${({ $active }) => ($active ? "#eceff1" : "transparent")};
  cursor: pointer;

  img {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background-color: #f5f5f5;
  }
`;

const MicButton = styled.button<{ $live: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: ${({ $live }) => ($live ? "#4caf50" : "#eceff1")};
  cursor: pointer;

  img {
    width: 22px;
    height: 22px;
    filter: ${({ $live }) => ($live ? "invert(1)" : "none")};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export function ChatInput({ debugOpen, onToggleDebug }: ChatInputProps) {
  const status = useAiStateStore((state) => state.status);
  const { connect, disconnect } = useAiContext();

  const isConnected = status === AiConnectionStatus.CONNECTED;
  const isBusy =
    status === AiConnectionStatus.CONNECTING ||
    status === AiConnectionStatus.DISCONNECTING;

  const toggleMic = () => {
    if (isBusy) return;
    if (isConnected) {
      void disconnect();
      return;
    }
    void connect();
  };

  return (
    <Bar>
      <Left>
        <Status
          tone={isConnected ? StatusTone.Success : StatusTone.Idle}
          label="Transport"
          value={AI_STATUS_LABEL[status]}
          activity={isBusy}
        />
        <Tooltip text={debugOpen ? "Hide debug" : "Show debug"}>
          <IconButton
            type="button"
            $active={debugOpen}
            onClick={onToggleDebug}
            aria-label="Toggle debug logs"
          >
            <img src="/debug.svg" alt="" />
          </IconButton>
        </Tooltip>
      </Left>
      <Tooltip text={isConnected ? "Disconnect microphone" : "Connect microphone"}>
        <MicButton
          type="button"
          $live={isConnected}
          onClick={toggleMic}
          disabled={isBusy}
          aria-label={isConnected ? "Disconnect" : "Connect"}
        >
          <img src="/mic.svg" alt="" />
        </MicButton>
      </Tooltip>
    </Bar>
  );
}

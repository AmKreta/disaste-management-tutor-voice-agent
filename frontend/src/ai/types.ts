export enum AiConnectionStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  DISCONNECTING = "disconnecting",
  ERROR = "error",
}

export enum LogKind {
  USER = "user",
  BOT = "bot",
  STATUS = "status",
  INFO = "info",
}

export type LogEntry = {
  id: string;
  message: string;
  timestamp: string;
  kind: LogKind;
};

export type VoiceSpeaker = LogKind.USER | LogKind.BOT | null;

export const AI_STATUS_LABEL: Record<AiConnectionStatus, string> = {
  [AiConnectionStatus.CONNECTED]: "Connected",
  [AiConnectionStatus.DISCONNECTED]: "Disconnected",
  [AiConnectionStatus.CONNECTING]: "Connecting",
  [AiConnectionStatus.DISCONNECTING]: "Disconnecting",
  [AiConnectionStatus.ERROR]: "Error",
};

import {
  PipecatClient,
  RTVIEvent,
  type PipecatClientOptions,
} from "@pipecat-ai/client-js";
import { WebSocketTransport } from "@pipecat-ai/websocket-transport";
import { AiConnectionStatus, LogKind, type VoiceSpeaker } from "../ai/types";
import type { ChatUpdateMode } from "../ai/store/useAiState";
import { BASE_URL } from "./constant";

type SessionHandlers = {
  onStatus: (status: AiConnectionStatus, label: string) => void;
  onLog: (message: string) => void;
  onChat: (
    message: string,
    kind: LogKind.USER | LogKind.BOT,
    mode?: ChatUpdateMode
  ) => void;
  onSpeaker: (speaker: VoiceSpeaker) => void;
};

const CONNECT_URL = `${BASE_URL}/connect`;

export class PipecatSession {
  private client: PipecatClient | null = null;

  constructor(
    private readonly handlers: SessionHandlers,
    private readonly audio: HTMLAudioElement
  ) {}

  private setupAudioTrack(track: MediaStreamTrack): void {
    this.handlers.onLog("Setting up audio track");
    if (this.audio.srcObject && "getAudioTracks" in this.audio.srcObject) {
      const oldTrack = this.audio.srcObject.getAudioTracks()[0];
      if (oldTrack?.id === track.id) return;
    }
    this.audio.srcObject = new MediaStream([track]);
  }

  private setupMediaTracks(): void {
    if (!this.client) return;
    const tracks = this.client.tracks();
    if (tracks.bot?.audio) {
      this.setupAudioTrack(tracks.bot.audio);
    }
  }

  private setupTrackListeners(): void {
    if (!this.client) return;

    this.client.on(RTVIEvent.TrackStarted, (track, participant) => {
      if (!participant?.local && track.kind === "audio") {
        this.setupAudioTrack(track);
      }
    });

    this.client.on(RTVIEvent.TrackStopped, (track, participant) => {
      this.handlers.onLog(
        `Track stopped: ${track.kind} from ${participant?.name || "unknown"}`
      );
    });
  }

  async connect(voiceId: string): Promise<void> {
    const startTime = Date.now();
    const config: PipecatClientOptions = {
      transport: new WebSocketTransport(),
      enableMic: true,
      enableCam: false,
      callbacks: {
        onConnected: () => {
          this.handlers.onStatus(AiConnectionStatus.CONNECTED, "Connected");
        },
        onDisconnected: () => {
          this.handlers.onChat("", LogKind.BOT, "finish");
          this.handlers.onChat("", LogKind.USER, "finish");
          this.handlers.onStatus(
            AiConnectionStatus.DISCONNECTED,
            "Disconnected"
          );
          this.handlers.onLog("Client disconnected");
        },
        onBotReady: (data) => {
          this.handlers.onLog(`Bot ready: ${JSON.stringify(data)}`);
          this.setupMediaTracks();
        },
        onUserStartedSpeaking: () => {
          this.handlers.onSpeaker(LogKind.USER);
        },
        onUserStoppedSpeaking: () => {
          this.handlers.onSpeaker(null);
        },
        onBotStartedSpeaking: () => {
          this.handlers.onSpeaker(LogKind.BOT);
        },
        onBotStoppedSpeaking: () => {
          this.handlers.onChat("", LogKind.BOT, "finish");
          this.handlers.onSpeaker(null);
        },
        onUserTranscript: (data) => {
          if (!data.final) {
            this.handlers.onSpeaker(LogKind.USER);
            this.handlers.onChat(data.text, LogKind.USER, "replace");
          } else {
            this.handlers.onChat(data.text, LogKind.USER, "final");
          }
        },
        onBotTtsText: (data) => {
          this.handlers.onChat(data.text, LogKind.BOT, "append");
        },
        onMessageError: (error) => console.error("Message error:", error),
        onError: (error) => console.error("Error:", error),
      },
    };

    this.client = new PipecatClient(config);
    window.pcClient = this.client;
    this.setupTrackListeners();

    this.handlers.onLog("Initializing devices...");
    await this.client.initDevices();

    this.handlers.onLog("Connecting to bot...");
    await this.client.startBotAndConnect({
      endpoint: CONNECT_URL,
      requestData: { voice: voiceId },
    });

    this.handlers.onLog(`Connection complete, timeTaken: ${Date.now() - startTime}`);
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;

    await this.client.disconnect();
    this.client = null;

    if (this.audio.srcObject && "getAudioTracks" in this.audio.srcObject) {
      this.audio.srcObject.getAudioTracks().forEach((track) => track.stop());
      this.audio.srcObject = null;
    }
  }
}

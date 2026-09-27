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
  private botLlmTextReceived = false;
  private closed = false;
  sessionId: string | null = null;

  constructor(
    private readonly handlers: SessionHandlers,
    private readonly audio: HTMLAudioElement
  ) {}

  private setupAudioTrack(track: MediaStreamTrack): void {
    if (this.closed) return;
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
      if (this.closed || participant?.local || track.kind !== "audio") return;
      this.setupAudioTrack(track);
    });

    this.client.on(RTVIEvent.TrackStopped, (track, participant) => {
      this.handlers.onLog(
        `Track stopped: ${track.kind} from ${participant?.name || "unknown"}`
      );
    });
  }

  async connect(voiceId: string): Promise<void> {
    this.closed = false;
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
        onBotLlmStarted: () => {
          this.botLlmTextReceived = false;
        },
        onBotLlmText: (data) => {
          if (!data.text) return;
          this.botLlmTextReceived = true;
          this.handlers.onChat(data.text, LogKind.BOT, "append");
        },
        onBotTtsText: (data) => {
          // LLM text arrives earlier and feeds the playback-synced transcript.
          // Keep TTS text as a compatibility fallback for transports that do
          // not emit BotLLMText frames.
          if (!this.botLlmTextReceived && data.text) {
            this.handlers.onChat(data.text, LogKind.BOT, "append");
          }
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

    this.sessionId = crypto.randomUUID();
    this.handlers.onLog("Connecting to bot...");
    await this.client.startBotAndConnect({
      endpoint: CONNECT_URL,
      requestData: { voice: voiceId, session_id: this.sessionId },
    });

    this.handlers.onLog(`Connection complete, timeTaken: ${Date.now() - startTime}`);
  }

  private forceCloseSocket(client: PipecatClient): void {
    const transport = client.transport as { _ws?: { close?: () => unknown } };
    try {
      void transport._ws?.close?.();
    } catch {
      // The socket may already be closed.
    }
  }

  private stopLocalAudio(): void {
    try {
      this.audio.pause();
      const srcObject = this.audio.srcObject;
      if (srcObject && "getAudioTracks" in srcObject) {
        srcObject.getAudioTracks().forEach((track) => track.stop());
        this.audio.srcObject = null;
      }
    } catch (error) {
      this.handlers.onLog(
        `Audio cleanup failed: ${(error as Error).message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    const client = this.client;
    this.closed = true;
    this.client = null;
    this.stopLocalAudio();

    if (!client) return;

    try {
      client.enableMic(false);
    } catch {
      // Mic may already be off or devices may not be ready.
    }

    try {
      await client.disconnect();
    } catch (error) {
      const message = (error as Error).message;
      if (!message.includes("please call .begin() first")) {
        this.handlers.onLog(`Transport disconnect failed: ${message}`);
      }
    }

    this.forceCloseSocket(client);
  }
}

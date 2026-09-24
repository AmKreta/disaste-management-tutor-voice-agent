import {
  PipecatClient,
  RTVIEvent,
  type PipecatClientOptions,
} from "@pipecat-ai/client-js";
import { WebSocketTransport } from "@pipecat-ai/websocket-transport";
import { AiConnectionStatus } from "../ai/types";

type SessionHandlers = {
  onStatus: (status: AiConnectionStatus, label: string) => void;
  onLog: (message: string) => void;
};

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

  async connect(): Promise<void> {
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
        onUserTranscript: (data) => {
          if (data.final) {
            this.handlers.onLog(`User: ${data.text}`);
          }
        },
        onBotTranscript: (data) => this.handlers.onLog(`Bot: ${data.text}`),
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
      endpoint: "http://localhost:7860/connect",
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

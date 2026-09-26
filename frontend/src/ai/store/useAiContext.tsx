import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { fetchSessionMetrics } from "../../service/metricsApi";
import { PipecatSession } from "../../service/pipecatSession";
import { AiConnectionStatus } from "../types";
import { useAiStateStore } from "./useAiState";

type AiContextValue = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const AiContext = createContext<AiContextValue | null>(null);

export function AiProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<PipecatSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setStatus = useAiStateStore((state) => state.setStatus);
  const addLog = useAiStateStore((state) => state.addLog);
  const addChatMessage = useAiStateStore((state) => state.addChatMessage);
  const setSpeaker = useAiStateStore((state) => state.setSpeaker);
  const setMetrics = useAiStateStore((state) => state.setMetrics);

  const connect = async () => {
    if (!audioRef.current) return;
    const voiceId = useAiStateStore.getState().selectedVoice;
    setMetrics(null);

    const session = new PipecatSession(
      {
        onStatus: (status, label) => {
          setStatus(status);
          addLog(`Status: ${label}`);
        },
        onLog: addLog,
        onChat: addChatMessage,
        onSpeaker: setSpeaker,
      },
      audioRef.current
    );
    sessionRef.current = session;

    try {
      setStatus(AiConnectionStatus.CONNECTING);
      await session.connect(voiceId);
    } catch (error) {
      addLog(`Error connecting: ${(error as Error).message}`);
      setStatus(AiConnectionStatus.ERROR);
      addLog("Status: Error");
      try {
        await session.disconnect();
      } catch (disconnectError) {
        addLog(`Error during disconnect: ${disconnectError}`);
      }
    }
  };

  const disconnect = async () => {
    const session = sessionRef.current;
    if (!session) return;
    const sessionId = session.sessionId;
    try {
      setStatus(AiConnectionStatus.DISCONNECTING);
      await session.disconnect();
    } catch (error) {
      addLog(`Error disconnecting: ${(error as Error).message}`);
    } finally {
      if (sessionRef.current === session) sessionRef.current = null;
      setSpeaker(null);
      setStatus(AiConnectionStatus.DISCONNECTED);
    }

    if (!sessionId) return;
    try {
      const metrics = await fetchSessionMetrics(sessionId);
      setMetrics(metrics);
      addLog(`Metrics loaded for session ${sessionId}`);
    } catch (error) {
      addLog(`Could not load session metrics: ${(error as Error).message}`);
    }
  };

  return (
    <AiContext.Provider value={{ connect, disconnect }}>
      {children}
      <audio ref={audioRef} autoPlay hidden />
    </AiContext.Provider>
  );
}

export function useAiContext(): AiContextValue {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error("useAiContext must be used within AiProvider");
  }
  return context;
}

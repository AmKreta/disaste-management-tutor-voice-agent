import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
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

  const connect = async () => {
    if (!audioRef.current) return;

    const session = new PipecatSession(
      {
        onStatus: (status, label) => {
          setStatus(status);
          addLog(`Status: ${label}`);
        },
        onLog: addLog,
        onChat: addChatMessage,
      },
      audioRef.current
    );
    sessionRef.current = session;

    try {
      setStatus(AiConnectionStatus.CONNECTING);
      await session.connect();
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
    if (!sessionRef.current) return;
    try {
      setStatus(AiConnectionStatus.DISCONNECTING);
      await sessionRef.current.disconnect();
      sessionRef.current = null;
    } catch (error) {
      addLog(`Error disconnecting: ${(error as Error).message}`);
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

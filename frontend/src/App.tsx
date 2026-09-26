import { Global, css } from "@emotion/react";
import { useState } from "react";
import { Chat } from "./ai/chat/chat";
import { AiProvider } from "./ai/store/useAiContext";
import { useAiStateStore } from "./ai/store/useAiState";
import { Welcome } from "./welcome";

const globalStyles = css`
  body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
  }
`;

export function App() {
  const [started, setStarted] = useState(false);
  const setSelectedVoice = useAiStateStore((state) => state.setSelectedVoice);

  return (
    <AiProvider>
      <Global styles={globalStyles} />
      {started ? (
        <Chat />
      ) : (
        <Welcome
          onContinue={(voiceId) => {
            setSelectedVoice(voiceId);
            setStarted(true);
          }}
        />
      )}
    </AiProvider>
  );
}

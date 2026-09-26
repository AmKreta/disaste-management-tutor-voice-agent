import { Global, css } from "@emotion/react";
import { Chat } from "./ai/chat/chat";
import { AiProvider } from "./ai/store/useAiContext";

const globalStyles = css`
  body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
  }
`;

export function App() {
  return (
    <AiProvider>
      <Global styles={globalStyles} />
      <Chat />
    </AiProvider>
  );
}

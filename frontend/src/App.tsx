import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import { ChatHeader } from "./ai/chatHeader";
import { DebugInfo } from "./ai/debugInfo";
import { AiProvider } from "./ai/store/useAiContext";

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

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
      <Global styles={globalStyles}/>
      <Page>
        <ChatHeader />
        <DebugInfo />
      </Page>
    </AiProvider>
  );
}

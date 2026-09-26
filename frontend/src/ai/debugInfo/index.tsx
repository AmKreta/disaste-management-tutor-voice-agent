import styled from "@emotion/styled";
import type { SessionMetrics } from "../../service/metricsApi";
import { Logs } from "../../ui/log";
import { useAiStateStore } from "../store/useAiState";

const Panel = styled.div<{ $compact?: boolean }>`
  background-color: #fff;
  border-radius: ${({ $compact }) => ($compact ? "10px" : "8px")};
  padding: ${({ $compact }) => ($compact ? "12px" : "20px")};
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: bold;
`;

const MetricsBox = styled.div`
  margin: 0 0 12px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
`;

const MetricLine = styled.div`
  color: #333;
`;

function formatSeconds(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(3)}s`;
}

function MetricsSummary({ metrics }: { metrics: SessionMetrics }) {
  const totals = metrics.totals;
  return (
    <MetricsBox>
      <MetricLine>session: {metrics.session_id}</MetricLine>
      <MetricLine>
        ttfb: avg {formatSeconds(totals.ttfb_avg_seconds)} / max{" "}
        {formatSeconds(totals.ttfb_max_seconds)} ({totals.ttfb_count})
      </MetricLine>
      <MetricLine>
        llm tokens: {totals.llm_total_tokens} (prompt {totals.llm_prompt_tokens},
        completion {totals.llm_completion_tokens})
      </MetricLine>
      <MetricLine>tts characters: {totals.tts_characters}</MetricLine>
      <MetricLine>stt audio: {formatSeconds(totals.stt_audio_seconds)}</MetricLine>
    </MetricsBox>
  );
}

export function DebugInfo({ compact = false }: { compact?: boolean }) {
  const logs = useAiStateStore((state) => state.logs);
  const metrics = useAiStateStore((state) => state.metrics);

  return (
    <Panel $compact={compact}>
      <Title>Debug Info</Title>
      {metrics ? <MetricsSummary metrics={metrics} /> : null}
      <Logs entries={logs} compact={compact} />
    </Panel>
  );
}

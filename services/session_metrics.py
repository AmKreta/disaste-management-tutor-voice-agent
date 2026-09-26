from typing import Any

from pipecat.observers.service_metrics_observer import (
    ServiceLatencyRecord,
    ServiceMetricsObserver,
    ServiceUsageKind,
    ServiceUsageRecord,
)

SESSION_METRICS: dict[str, dict[str, Any]] = {}


class SessionMetricsCollector:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.latencies: list[ServiceLatencyRecord] = []
        self.usages: list[ServiceUsageRecord] = []

    def add_latency(self, record: ServiceLatencyRecord) -> None:
        self.latencies.append(record)

    def add_usage(self, record: ServiceUsageRecord) -> None:
        self.usages.append(record)

    def snapshot(self) -> dict[str, Any]:
        ttfb = [record.seconds for record in self.latencies if record.kind == "ttfb"]
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        tts_characters = 0
        stt_audio_seconds = 0.0

        for record in self.usages:
            if record.kind == ServiceUsageKind.LLM:
                prompt_tokens += record.prompt_tokens or 0
                completion_tokens += record.completion_tokens or 0
                total_tokens += record.total_tokens or 0
            elif record.kind == ServiceUsageKind.TTS:
                tts_characters += record.characters or 0
            elif record.kind == ServiceUsageKind.STT:
                stt_audio_seconds += record.audio_seconds or 0.0

        return {
            "session_id": self.session_id,
            "totals": {
                "ttfb_count": len(ttfb),
                "ttfb_avg_seconds": round(sum(ttfb) / len(ttfb), 3) if ttfb else None,
                "ttfb_max_seconds": round(max(ttfb), 3) if ttfb else None,
                "llm_prompt_tokens": prompt_tokens,
                "llm_completion_tokens": completion_tokens,
                "llm_total_tokens": total_tokens,
                "tts_characters": tts_characters,
                "stt_audio_seconds": round(stt_audio_seconds, 3),
            },
            "latency": [record.model_dump() for record in self.latencies],
            "usage": [record.model_dump() for record in self.usages],
        }


def store_session_metrics(session_id: str, metrics: dict[str, Any]) -> None:
    SESSION_METRICS[session_id] = metrics


def get_session_metrics(session_id: str) -> dict[str, Any] | None:
    return SESSION_METRICS.get(session_id)


def attach_session_metrics(session_id: str) -> tuple[ServiceMetricsObserver, SessionMetricsCollector]:
    observer = ServiceMetricsObserver()
    collector = SessionMetricsCollector(session_id)

    @observer.event_handler("on_service_latency")
    async def on_service_latency(_observer, record: ServiceLatencyRecord) -> None:
        collector.add_latency(record)

    @observer.event_handler("on_service_usage")
    async def on_service_usage(_observer, record: ServiceUsageRecord) -> None:
        collector.add_usage(record)

    return observer, collector

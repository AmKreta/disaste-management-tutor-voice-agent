from typing import Any

from pipecat.observers.service_metrics_observer import (
    ServiceLatencyRecord,
    ServiceMetricsObserver,
    ServiceUsageKind,
    ServiceUsageRecord,
)

SESSION_METRICS: dict[str, dict[str, Any]] = {}
COLLECTORS: dict[str, "SessionMetricsCollector"] = {}
_last_connect_session_id: str | None = None


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

    def persist(self) -> dict[str, Any]:
        snapshot = self.snapshot()
        store_session_metrics(self.session_id, snapshot)
        return snapshot


def store_session_metrics(session_id: str, metrics: dict[str, Any]) -> None:
    SESSION_METRICS[session_id] = metrics


def get_session_metrics(session_id: str) -> dict[str, Any] | None:
    return SESSION_METRICS.get(session_id)


def register_session(session_id: str) -> SessionMetricsCollector:
    global _last_connect_session_id
    _last_connect_session_id = session_id
    collector = COLLECTORS.get(session_id) or SessionMetricsCollector(session_id)
    COLLECTORS[session_id] = collector
    collector.persist()
    return collector


def resolve_session_id(value: Any) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if _last_connect_session_id:
        return _last_connect_session_id
    return ""


def collector_for(session_id: str) -> SessionMetricsCollector:
    return COLLECTORS.get(session_id) or register_session(session_id)


def finalize_session_metrics(session_id: str) -> dict[str, Any] | None:
    collector = COLLECTORS.get(session_id)
    if collector:
        return collector.persist()
    return get_session_metrics(session_id)


def clear_session_metrics() -> None:
    global _last_connect_session_id
    SESSION_METRICS.clear()
    COLLECTORS.clear()
    _last_connect_session_id = None


def attach_session_metrics(session_id: str) -> tuple[ServiceMetricsObserver, SessionMetricsCollector]:
    observer = ServiceMetricsObserver()
    collector = collector_for(session_id)

    @observer.event_handler("on_service_latency")
    async def on_service_latency(_observer, record: ServiceLatencyRecord) -> None:
        collector.add_latency(record)
        collector.persist()

    @observer.event_handler("on_service_usage")
    async def on_service_usage(_observer, record: ServiceUsageRecord) -> None:
        collector.add_usage(record)
        collector.persist()

    return observer, collector

from pipecat.observers.service_metrics_observer import (
    ServiceLatencyKind,
    ServiceLatencyRecord,
    ServiceUsageKind,
    ServiceUsageRecord,
)

from services.session_metrics import (
    SessionMetricsCollector,
    clear_session_metrics,
    finalize_session_metrics,
    get_session_metrics,
    register_session,
    resolve_session_id,
    store_session_metrics,
)


def test_snapshot_totals_usage_and_ttfb():
    collector = SessionMetricsCollector("session-1")
    collector.add_latency(
        ServiceLatencyRecord(
            kind=ServiceLatencyKind.TTFB,
            processor="llm",
            timestamp=1,
            seconds=0.2,
        )
    )
    collector.add_latency(
        ServiceLatencyRecord(
            kind=ServiceLatencyKind.TTFB,
            processor="tts",
            timestamp=2,
            seconds=0.4,
        )
    )
    collector.add_usage(
        ServiceUsageRecord(
            kind=ServiceUsageKind.LLM,
            processor="llm",
            timestamp=3,
            prompt_tokens=10,
            completion_tokens=5,
            total_tokens=15,
        )
    )
    collector.add_usage(
        ServiceUsageRecord(
            kind=ServiceUsageKind.TTS,
            processor="tts",
            timestamp=4,
            characters=42,
        )
    )
    collector.add_usage(
        ServiceUsageRecord(
            kind=ServiceUsageKind.STT,
            processor="stt",
            timestamp=5,
            audio_seconds=1.25,
        )
    )

    snapshot = collector.snapshot()

    assert snapshot["session_id"] == "session-1"
    assert snapshot["totals"] == {
        "ttfb_count": 2,
        "ttfb_avg_seconds": 0.3,
        "ttfb_max_seconds": 0.4,
        "llm_prompt_tokens": 10,
        "llm_completion_tokens": 5,
        "llm_total_tokens": 15,
        "tts_characters": 42,
        "stt_audio_seconds": 1.25,
    }


def test_store_and_get_session_metrics():
    store_session_metrics("session-2", {"session_id": "session-2"})
    assert get_session_metrics("session-2") == {"session_id": "session-2"}
    assert get_session_metrics("missing") is None


def test_register_session_makes_metrics_fetchable():
    clear_session_metrics()
    collector = register_session("session-3")
    collector.add_usage(
        ServiceUsageRecord(
            kind=ServiceUsageKind.TTS,
            processor="tts",
            timestamp=1,
            characters=9,
        )
    )
    snapshot = finalize_session_metrics("session-3")
    assert snapshot is not None
    assert snapshot["totals"]["tts_characters"] == 9
    assert resolve_session_id(None) == "session-3"

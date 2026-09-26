"""API route tests; external agent and audio services are mocked."""

from fastapi.testclient import TestClient

import main


def test_list_voice_samples(monkeypatch):
    voices = [{"id": "alloy", "name": "Alloy"}, {"id": "nova", "name": "Nova"}]
    monkeypatch.setattr(main, "list_voices", lambda: voices)

    response = TestClient(main.app).get("/sample/voice")

    assert response.status_code == 200
    assert response.json() == {"voices": voices}


def test_play_voice_sample_returns_audio(monkeypatch):
    async def synthesize(voice_id: str) -> bytes:
        assert voice_id == "nova"
        return b"sample-audio"

    monkeypatch.setattr(main, "synthesize_sample", synthesize)

    response = TestClient(main.app).get("/sample/play/nova")

    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"sample-audio"


def test_play_unknown_voice_returns_not_found(monkeypatch):
    async def synthesize(_voice_id: str) -> bytes:
        raise AssertionError("unknown voices must not be synthesized")

    monkeypatch.setattr(main, "synthesize_sample", synthesize)

    response = TestClient(main.app).get("/sample/play/not-a-voice")

    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown voice"}


def test_play_sample_maps_synthesis_error_to_bad_gateway(monkeypatch):
    async def synthesize(_voice_id: str) -> bytes:
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(main, "synthesize_sample", synthesize)

    response = TestClient(main.app).get("/sample/play/alloy")

    assert response.status_code == 502
    assert response.json() == {"detail": "Could not generate voice sample"}


def _assert_connect(response, voice: str, session_id: str | None = None):
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"ws_url"}
    prefix = f"ws://localhost:7860/ws?voice={voice}&session="
    assert data["ws_url"].startswith(prefix)
    returned_session = data["ws_url"].removeprefix(prefix)
    assert returned_session
    if session_id is not None:
        assert returned_session == session_id


def test_connect_uses_requested_known_voice():
    response = TestClient(main.app).post(
        "/connect", json={"voice": "nova", "session_id": "session-1"}
    )
    _assert_connect(response, "nova", "session-1")


def test_connect_defaults_to_alloy_for_invalid_or_missing_voice():
    client = TestClient(main.app)

    for body in ({"voice": "not-a-voice"}, {}, ["nova"]):
        response = client.post("/connect", json=body)
        _assert_connect(response, "alloy")


def test_connect_defaults_to_alloy_for_invalid_json():
    response = TestClient(main.app).post(
        "/connect", content="not-json", headers={"content-type": "application/json"}
    )
    _assert_connect(response, "alloy")


def test_get_metrics_returns_stored_session(monkeypatch):
    metrics = {"session_id": "session-1", "totals": {"llm_total_tokens": 12}}
    monkeypatch.setattr(main, "get_session_metrics", lambda session_id: metrics if session_id == "session-1" else None)

    response = TestClient(main.app).get("/metrics/session-1")

    assert response.status_code == 200
    assert response.json() == metrics


def test_get_unknown_metrics_returns_not_found(monkeypatch):
    monkeypatch.setattr(main, "get_session_metrics", lambda _session_id: None)

    response = TestClient(main.app).get("/metrics/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown session"}


def test_websocket_uses_known_voice(monkeypatch):
    received: list[tuple[object, str, str]] = []

    async def run_bot(websocket, voice: str, session_id: str = "") -> None:
        received.append((websocket, voice, session_id))

    monkeypatch.setattr(main, "run_bot", run_bot)

    with TestClient(main.app).websocket_connect("/ws?voice=nova&session=session-1"):
        pass

    assert len(received) == 1
    assert received[0][1] == "nova"
    assert received[0][2] == "session-1"


def test_websocket_defaults_invalid_voice_and_handles_agent_error(monkeypatch):
    received: list[tuple[str, str]] = []

    async def run_bot(_websocket, voice: str, session_id: str = "") -> None:
        received.append((voice, session_id))
        raise RuntimeError("agent stopped")

    monkeypatch.setattr(main, "run_bot", run_bot)

    with TestClient(main.app).websocket_connect("/ws?voice=invalid"):
        pass

    assert received[0][0] == "alloy"
    assert received[0][1]

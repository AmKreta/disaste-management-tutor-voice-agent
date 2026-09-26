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


def test_connect_uses_requested_known_voice():
    response = TestClient(main.app).post("/connect", json={"voice": "nova"})

    assert response.status_code == 200
    assert response.json() == {"ws_url": "ws://localhost:7860/ws?voice=nova"}


def test_connect_defaults_to_alloy_for_invalid_or_missing_voice():
    client = TestClient(main.app)

    for body in ({"voice": "not-a-voice"}, {}, ["nova"]):
        response = client.post("/connect", json=body)
        assert response.status_code == 200
        assert response.json() == {"ws_url": "ws://localhost:7860/ws?voice=alloy"}


def test_connect_defaults_to_alloy_for_invalid_json():
    response = TestClient(main.app).post(
        "/connect", content="not-json", headers={"content-type": "application/json"}
    )

    assert response.status_code == 200
    assert response.json() == {"ws_url": "ws://localhost:7860/ws?voice=alloy"}


def test_websocket_uses_known_voice(monkeypatch):
    received: list[tuple[object, str]] = []

    async def run_bot(websocket, voice: str) -> None:
        received.append((websocket, voice))

    monkeypatch.setattr(main, "run_bot", run_bot)

    with TestClient(main.app).websocket_connect("/ws?voice=nova"):
        pass

    assert len(received) == 1
    assert received[0][1] == "nova"


def test_websocket_defaults_invalid_voice_and_handles_agent_error(monkeypatch):
    received: list[str] = []

    async def run_bot(_websocket, voice: str) -> None:
        received.append(voice)
        raise RuntimeError("agent stopped")

    monkeypatch.setattr(main, "run_bot", run_bot)

    with TestClient(main.app).websocket_connect("/ws?voice=invalid"):
        pass

    assert received == ["alloy"]

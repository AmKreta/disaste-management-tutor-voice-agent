import os
from typing import Literal, get_args

from openai import AsyncOpenAI

VoiceId = Literal[
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "nova",
    "onyx",
    "sage",
    "shimmer",
    "verse",
    "marin",
    "cedar",
]

TTS_MODEL = "gpt-4o-mini-tts"
SAMPLE_TEXT = "Hello. I'll be your tutor today. Let's get started."
SAMPLE_INSTRUCTIONS = "Speak clearly and at a natural pace."

VOICES: list[dict[str, str]] = [
    {"id": voice_id, "name": voice_id.capitalize()} for voice_id in get_args(VoiceId)
]
VOICE_IDS = {voice["id"] for voice in VOICES}

_sample_cache: dict[str, bytes] = {}


def list_voices() -> list[dict[str, str]]:
    return VOICES


def is_known_voice(voice_id: str) -> bool:
    return voice_id in VOICE_IDS


async def synthesize_sample(voice_id: str) -> bytes:
    cached = _sample_cache.get(voice_id)
    if cached is not None:
        return cached

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    client = AsyncOpenAI(api_key=api_key)
    response = await client.audio.speech.create(
        model=TTS_MODEL,
        voice=voice_id,
        input=SAMPLE_TEXT,
        instructions=SAMPLE_INSTRUCTIONS,
        response_format="mp3",
    )
    audio = response.content
    _sample_cache[voice_id] = audio
    return audio

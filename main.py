#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from services import run_bot
from services.voice_sample import is_known_voice, list_voices, synthesize_sample

# Load environment variables
load_dotenv(override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles FastAPI startup and shutdown."""
    yield  # Run app


# Initialize FastAPI app with lifespan manager
app = FastAPI(lifespan=lifespan)

# Configure CORS to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _voice_from_value(value: Any) -> str:
    if isinstance(value, str) and is_known_voice(value):
        return value
    return "alloy"


@app.get("/sample/voice")
async def get_sample_voices() -> Dict[str, Any]:
    return {"voices": list_voices()}


@app.get("/sample/play/{voice_id}")
async def play_sample(voice_id: str) -> Response:
    if not is_known_voice(voice_id):
        raise HTTPException(status_code=404, detail="Unknown voice")
    try:
        audio = await synthesize_sample(voice_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not generate voice sample") from exc
    return Response(content=audio, media_type="audio/mpeg")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    voice = _voice_from_value(websocket.query_params.get("voice"))
    print("WebSocket connection accepted")
    try:
        await run_bot(websocket, voice)
    except Exception as e:
        print(f"Exception in run_bot: {e}")


@app.post("/connect")
async def bot_connect(request: Request) -> Dict[Any, Any]:
    voice = "alloy"
    try:
        body = await request.json()
    except Exception:
        body = None
    if isinstance(body, dict):
        voice = _voice_from_value(body.get("voice"))
    return {"ws_url": f"ws://localhost:7860/ws?voice={voice}"}


async def main():
    tasks = []
    try:
        config = uvicorn.Config(app, host="0.0.0.0", port=7860)
        server = uvicorn.Server(config)
        tasks.append(server.serve())

        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        print("Tasks cancelled (probably due to shutdown).")


if __name__ == "__main__":
    asyncio.run(main())
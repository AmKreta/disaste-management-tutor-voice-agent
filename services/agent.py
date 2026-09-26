import os
from fastapi import WebSocket
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext, LLMContextMessage
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAIRealtimeSTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transports.websocket.fastapi import FastAPIWebsocketParams, FastAPIWebsocketTransport

from .presentation_observer import PresentationObserver
from .prompts.tutor_llm_prompt import tutor_llm_prompt
from .prompts.tutor_stt_prompt import tutor_stt_prompt
from .prompts.tutor_tss_propmt import tutor_tss_prompt

def get_api_key():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    return api_key

def create_stt(api_key: str):
    return OpenAIRealtimeSTTService(
        api_key=api_key,
        model="gpt-4o-transcribe",
        prompt=tutor_stt_prompt,
    )

def create_tts(api_key: str, voice: str):
    return OpenAITTSService(
        api_key=api_key,
        model="gpt-4o-mini-tts",
        voice=voice,
        instructions=tutor_tss_prompt,
    )

def create_llm(api_key: str):
    return OpenAILLMService(
        api_key=api_key,
        model="gpt-4o",
    )

def create_websocket_transport(websocket_client: WebSocket):
    return FastAPIWebsocketTransport(
        websocket=websocket_client,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            serializer=ProtobufFrameSerializer(),
        ),
    )
    
def create_vad_params():
    # Stricter VAD to reduce false "user spoke" from background noise: higher confidence,
    # longer sustained speech before trigger, higher minimum volume.
    return VADParams(
        confidence=0.85,
        start_secs=0.45,
        stop_secs=0.35,
        min_volume=0.7,
    )

def create_context_aggregator():
    return LLMContextAggregatorPair(
        LLMContext(messages=[{"role": "system", "content": tutor_llm_prompt}]),
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(params=create_vad_params()),
        ),
    )

def create_pipeline(websocket_transport: FastAPIWebsocketTransport, voice: str):
    context_aggregator = create_context_aggregator()
    stt = create_stt(get_api_key())
    llm = create_llm(get_api_key())
    tts = create_tts(get_api_key(), voice)
    return Pipeline(
        [
            websocket_transport.input(),
            stt,
            context_aggregator.user(),
            llm,
            tts,
            websocket_transport.output(),
            context_aggregator.assistant(),
        ]
    )

def create_task(websocket_transport: FastAPIWebsocketTransport, voice: str):
    presentation_observer = PresentationObserver()
    task = PipelineTask(
        create_pipeline(websocket_transport, voice),
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        observers=[presentation_observer],
        enable_turn_tracking=False
    )
    presentation_observer.set_task(task)
    return task

def add_event_handlers(websocket_transport: FastAPIWebsocketTransport, task: PipelineTask):
    @websocket_transport.event_handler("on_client_connected")
    async def on_client_connected():
        logger.info("[transport] client connected")

    @websocket_transport.event_handler("on_client_disconnected")
    async def on_client_disconnected():
        logger.info("[transport] client disconnected")
        await task.cancel()

async def run_bot(websocket_client: WebSocket, voice: str = "alloy"):
    websocket_transport = create_websocket_transport(websocket_client)
    task = create_task(websocket_transport, voice)
    add_event_handlers(websocket_transport, task)
    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)
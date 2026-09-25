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


class PresentationBot:
    def __init__(self, websocket_client: WebSocket):
        self.websocket_transport = self.create_websocket_transport(websocket_client)
        self.api_key = self.get_api_key();
        self.stt = self.create_stt(self.api_key)
        self.tts = self.create_tts(self.api_key)
        self.llm = self.create_llm(self.api_key)
        self.task = self.create_task()
        self.add_event_handlers()

    def get_api_key(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        return api_key

    def create_stt(self, api_key: str):
        return OpenAIRealtimeSTTService(
            api_key=api_key,
            model="gpt-4o-transcribe",
        )

    def create_tts(self, api_key: str):
        return OpenAITTSService(
            api_key=api_key,
            model="gpt-4o-mini-tts",
            voice="alloy",
            instructions="AI presenter for business people. Speak fast.",
        )

    def create_llm(self, api_key: str):
        return OpenAILLMService(
            api_key=api_key,
            model="gpt-4o",
        )

    def create_websocket_transport(self, websocket_client: WebSocket):
        return FastAPIWebsocketTransport(
            websocket=websocket_client,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
            ),
        )
    
    def create_vad_params(self):
        # Stricter VAD to reduce false "user spoke" from background noise: higher confidence,
        # longer sustained speech before trigger, higher minimum volume.
        return VADParams(
            confidence=0.85,
            start_secs=0.45,
            stop_secs=0.35,
            min_volume=0.7,
        )

    def create_llm_context(self):
        return LLMContext([])

    def create_context_aggregator(self):
        return LLMContextAggregatorPair(
            self.create_llm_context(),
            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(params=self.create_vad_params()),
            ),
        )

    def create_pipeline(self):
        context_aggregator = self.create_context_aggregator()
        return Pipeline(
            [
                self.websocket_transport.input(),
                self.stt,
                context_aggregator.user(),
                self.llm,
                self.tts,
                self.websocket_transport.output(),
                context_aggregator.assistant(),
            ]
        )

    def create_task(self):
        presentation_observer = PresentationObserver()
        return PipelineTask(
            self.create_pipeline(),
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

    def add_event_handlers(self):
        @self.websocket_transport.event_handler("on_client_connected")
        async def on_client_connected():
            logger.info("[transport] client connected")

        @self.websocket_transport.event_handler("on_client_disconnected")
        async def on_client_disconnected():
            logger.info("[transport] client disconnected")
            await self.task.cancel()

    async def run(self):
        runner = PipelineRunner(handle_sigint=False)
        await runner.run(self.task)
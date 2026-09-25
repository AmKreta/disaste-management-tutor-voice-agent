import asyncio
from loguru import logger
from pipecat.observers.base_observer import BaseObserver, FramePushed
from pipecat.pipeline.task import PipelineTask

from pipecat.frames.frames import (
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    CancelFrame,
    EndFrame,
    LLMMessagesAppendFrame,
    UserStartedSpeakingFrame, StartFrame,
)

from constant import SLIDE_SYSTEM_MESSAGES

class PresentationObserver(BaseObserver):
    """Observer that advances slides after 5 seconds of bot silence."""

    def __init__(self):
        super().__init__()
        self.current_slide = -1
        self.task: PipelineTask | None = None
        self._is_bot_speaking = False
        self._silence_timer: asyncio.TimerHandle | None = None
        self._user_spoke_since_last_slide = False

    def set_task(self, task: PipelineTask):
        self.task = task

    def _cancel_silence_timer(self):
        if self._silence_timer:
            self._silence_timer.cancel()
            self._silence_timer = None

    def _schedule_silence_check(self):
        # Schedule a check 5 seconds after the bot stops speaking.
        self._cancel_silence_timer()
        loop = asyncio.get_event_loop()
        self._silence_timer = loop.call_later(
            3.0,
            lambda: asyncio.create_task(self._on_silence_timeout()),
        )

    async def _on_silence_timeout(self):
        if not self._is_bot_speaking:
            if self._user_spoke_since_last_slide:
                logger.info("3 seconds silence after user spoke; staying on slide and instructing AI to continue.")
                await self.continue_current_slide()
            else:
                logger.info("3 seconds of bot silence detected; queuing next slide.")
                await self.go_to_next_slide()

    async def on_push_frame(self, data: FramePushed):
        frame = data.frame

        if isinstance(frame, StartFrame):
            # Pipeline just started, force start with first slide
            await self._on_silence_timeout()

        elif isinstance(frame, BotStartedSpeakingFrame):
            self._is_bot_speaking = True
            self._cancel_silence_timer()

        elif isinstance(frame, UserStartedSpeakingFrame):
            self._user_spoke_since_last_slide = True
            self._cancel_silence_timer()

        elif isinstance(frame, BotStoppedSpeakingFrame):
            self._is_bot_speaking = False
            self._schedule_silence_check()

        elif isinstance(frame, (EndFrame, CancelFrame)):
            # Pipeline is ending; stop any pending timers.
            self._cancel_silence_timer()

        # Observers are side-effect-only; nothing to push downstream.

    async def continue_current_slide(self):
        """Instruct the AI to stay on the current slide and continue where it left off."""
        if self.current_slide < 0 or self.current_slide >= len(SLIDE_SYSTEM_MESSAGES):
            return
        self._user_spoke_since_last_slide = False
        slide_num = self.current_slide + 1
        slide_content = SLIDE_SYSTEM_MESSAGES[self.current_slide]
        slide_title = slide_content.split("\n\n")[0].strip() if slide_content else f"Slide {slide_num}"
        new_messages = [
            {
                "role": "system",
                "content": (
                    f"You are still on {slide_title}. Continue presenting this slide where you left off. "
                    "Do not repeat what you already said; pick up from there."
                ),
            }
        ]
        await self.task.queue_frames([LLMMessagesAppendFrame(messages=new_messages, run_llm=True)])

    async def go_to_next_slide(self):
        self.current_slide += 1
        self._user_spoke_since_last_slide = False
        new_messages = []
        if self.current_slide < len(SLIDE_SYSTEM_MESSAGES) - 1:
            print(f"Adding slide {self.current_slide} to context")
            new_messages.append({"role": "system", "content": SLIDE_SYSTEM_MESSAGES[self.current_slide]})
        elif self.current_slide == len(SLIDE_SYSTEM_MESSAGES) - 1:
            print(f"Adding goodbye slide to context")
            new_messages.append({"role": "system", "content": "Say goodbye and end the presentation."})

        if len(new_messages) > 0:
            await self.task.queue_frames([LLMMessagesAppendFrame(messages=new_messages, run_llm=True)])
        else:
            logger.critical("NO SLIDE TO INSERT")

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
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
    StartFrame,
)

from .constant import SLIDE_SYSTEM_MESSAGES

class PresentationObserver(BaseObserver):
    """Observer that advances slides after 5 seconds of bot silence."""

    def __init__(self):
        super().__init__()
        self.current_slide = -1
        self.task: PipelineTask | None = None
        self._is_bot_speaking = False
        self._silence_timer: asyncio.TimerHandle | None = None
        self._user_spoke_since_last_slide = False
        self._started = False
        self._in_qna = False
        self._awaiting_question_answer = False
        self._answer_watchdog: asyncio.TimerHandle | None = None

    def set_task(self, task: PipelineTask):
        self.task = task

    def _cancel_silence_timer(self):
        if self._silence_timer:
            self._silence_timer.cancel()
            self._silence_timer = None

    def _cancel_answer_watchdog(self):
        if self._answer_watchdog:
            self._answer_watchdog.cancel()
            self._answer_watchdog = None

    def _schedule_answer_watchdog(self):
        # Fallback in case a learner "turn" never produces a bot reply (e.g. a
        # spurious VAD trigger from background noise with no real speech).
        # Without this, _awaiting_question_answer would only ever get cleared
        # by BotStartedSpeakingFrame, permanently blocking silence-driven slide
        # advancement for the rest of the session.
        self._cancel_answer_watchdog()
        loop = asyncio.get_event_loop()
        self._answer_watchdog = loop.call_later(
            6.0,
            lambda: asyncio.create_task(self._on_answer_watchdog_timeout()),
        )

    async def _on_answer_watchdog_timeout(self):
        if self._awaiting_question_answer and not self._is_bot_speaking:
            logger.info("No bot reply after learner turn; resuming silence-driven progression.")
            self._awaiting_question_answer = False
            self._schedule_silence_check()

    def _schedule_silence_check(self):
        # Schedule a check 5 seconds after the bot stops speaking.
        self._cancel_silence_timer()
        loop = asyncio.get_event_loop()
        self._silence_timer = loop.call_later(
            3.0,
            lambda: asyncio.create_task(self._on_silence_timeout()),
        )

    async def _on_silence_timeout(self):
        if self._in_qna:
            return
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
            # StartFrame is forwarded through the pipeline. Queue the first
            # slide only for its first observation.
            if not self._started:
                self._started = True
                await self.go_to_next_slide()

        elif isinstance(frame, BotStartedSpeakingFrame):
            self._is_bot_speaking = True
            self._cancel_silence_timer()
            self._cancel_answer_watchdog()
            # The first tutor turn after learner speech is the answer. Resume
            # the interrupted slide only after this answer has finished.
            self._awaiting_question_answer = False

        elif isinstance(frame, UserStartedSpeakingFrame):
            self._user_spoke_since_last_slide = True
            self._awaiting_question_answer = True
            self._cancel_silence_timer()
            self._cancel_answer_watchdog()

        elif isinstance(frame, UserStoppedSpeakingFrame):
            if self._awaiting_question_answer and not self._is_bot_speaking:
                self._schedule_answer_watchdog()

        elif isinstance(frame, BotStoppedSpeakingFrame):
            self._is_bot_speaking = False
            if not self._awaiting_question_answer:
                self._schedule_silence_check()

        elif isinstance(frame, (EndFrame, CancelFrame)):
            # Pipeline is ending; stop any pending timers.
            self._cancel_silence_timer()
            self._cancel_answer_watchdog()

        # Observers are side-effect-only; nothing to push downstream.

    async def continue_current_slide(self):
        """Instruct the AI to stay on the current slide and continue where it left off."""
        if self._in_qna:
            return
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
        if self._in_qna:
            return
        self.current_slide += 1
        self._user_spoke_since_last_slide = False
        new_messages = []
        if self.current_slide < len(SLIDE_SYSTEM_MESSAGES):
            print(f"Adding slide {self.current_slide} to context")
            new_messages.append({"role": "system", "content": SLIDE_SYSTEM_MESSAGES[self.current_slide]})
        elif self.current_slide == len(SLIDE_SYSTEM_MESSAGES):
            self._in_qna = True
            print("Entering Q&A mode")
            new_messages.append({
                "role": "system",
                "content": (
                    "The presentation is complete. Give one short closing thought and invite "
                    "the learner to ask a question once. Then stay in Q&A mode: answer each "
                    "learner turn directly and naturally, and wait for their next turn. Do "
                    "not greet again, repeat the presentation summary, invite more questions "
                    "after every answer, or end the conversation."
                ),
            })

        if len(new_messages) > 0:
            await self.task.queue_frames([LLMMessagesAppendFrame(messages=new_messages, run_llm=True)])
        else:
            logger.critical("NO SLIDE TO INSERT")

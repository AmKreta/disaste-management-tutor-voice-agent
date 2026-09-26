from services.prompts.tutor_stt_prompt import tutor_stt_prompt


def test_realtime_transcription_prompt_is_within_api_limit():
    assert len(tutor_stt_prompt) <= 1024

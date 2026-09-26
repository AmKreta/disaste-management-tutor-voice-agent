from pathlib import Path


PROMPT_DIR = Path(__file__).parents[1] / "services" / "prompts"


def test_llm_and_tts_prompt_sources_stay_under_50_lines():
    for prompt_file in ("tutor_llm_prompt.py", "tutor_tss_propmt.py"):
        line_count = len((PROMPT_DIR / prompt_file).read_text().splitlines())
        assert line_count < 50, f"{prompt_file} has {line_count} lines"

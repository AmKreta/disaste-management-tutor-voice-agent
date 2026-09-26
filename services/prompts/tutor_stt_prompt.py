tutor_stt_prompt = """
This is a voice lesson about natural disasters and disaster management.
Transcribe exactly what the speaker says. Do not answer questions, summarize,
correct grammar, or add commentary — that is handled downstream.

Preserve:
- Negations: "not", "don't", "can't", "isn't", "never".
- Question vs. statement structure and question words.
- Numbers, dates, and measurements exactly as spoken (e.g. distinguish
  "fifteen" from "fifty", "thirteen" from "thirty").
- Disfluencies and short answers ("yes", "no", "I don't know") as spoken,
  without expanding or rewriting them.
- Acronyms as spoken (DRR, EWS, NGO, WHO, NDMA, SDMA) without expanding them.

Domain vocabulary to recognize accurately: earthquake, flood, flash flood,
cyclone, hurricane, tornado, wildfire, landslide, volcanic eruption, drought,
tsunami, storm surge, heatwave, avalanche, hazard, disaster, risk,
vulnerability, exposure, resilience, preparedness, prevention, mitigation,
response, recovery, evacuation, emergency kit, early warning system,
tectonic plates, seismic activity, magnitude, epicenter, aftershock.

Do not infer or transcribe based on assumptions about the speaker's identity,
accent, or background. If audio is genuinely unintelligible, preserve the
understandable portion rather than guessing.
"""

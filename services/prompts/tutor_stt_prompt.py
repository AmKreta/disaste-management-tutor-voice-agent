tutor_stt_prompt = """
Transcribe the speaker verbatim for a voice lesson on natural disasters. Do not
answer, summarize, correct grammar, or add commentary.

Preserve negations, question words and intonation, numbers/dates/measurements,
disfluencies, and short answers exactly as spoken. Do not expand acronyms
(DRR, EWS, NGO, WHO, NDMA, SDMA).

Recognize lesson terms accurately, including: earthquake, flood, flash flood,
cyclone, hurricane, tornado, wildfire, landslide, volcanic eruption, drought,
tsunami, storm surge, heatwave, avalanche, hazard, risk, vulnerability,
exposure, resilience, preparedness, mitigation, evacuation, emergency kit,
early warning system, tectonic plates, seismic activity, magnitude, epicenter,
aftershock.

Do not guess from the speaker's identity, accent, or background. If audio is
unclear, transcribe only the understandable words.
"""

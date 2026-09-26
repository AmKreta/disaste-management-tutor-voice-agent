import { BASE_URL } from "./constant";

export type VoiceOption = {
  id: string;
  name: string;
};

export async function fetchVoices(): Promise<VoiceOption[]> {
  const response = await fetch(`${BASE_URL}/sample/voice`);
  if (!response.ok) {
    throw new Error("Could not load voices");
  }
  const data = (await response.json()) as { voices: VoiceOption[] };
  return data.voices;
}

export async function fetchVoiceSample(voiceId: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/sample/play/${voiceId}`);
  if (!response.ok) {
    throw new Error("Could not play voice sample");
  }
  return response.blob();
}

import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { fetchVoiceSample, fetchVoices, type VoiceOption } from "../service/voiceApi";

type WelcomeProps = {
  onContinue: (voiceId: string) => void;
};

const Shell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 40px);
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #111;
`;

const Copy = styled.p`
  margin: 0 0 24px;
  color: #616161;
  font-size: 14px;
  line-height: 1.5;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #424242;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  font-size: 14px;
  color: #111;

  &:disabled {
    opacity: 0.6;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  background-color: ${({ $primary }) => ($primary ? "#4caf50" : "#eceff1")};
  color: ${({ $primary }) => ($primary ? "#fff" : "#111")};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  margin: 12px 0 0;
  min-height: 18px;
  font-size: 13px;
  color: #c62828;
`;

export function Welcome({ onContinue }: WelcomeProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceId, setVoiceId] = useState("alloy");
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sampleUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchVoices()
      .then((nextVoices) => {
        if (cancelled) return;
        setVoices(nextVoices);
        if (nextVoices.length > 0 && !nextVoices.some((voice) => voice.id === "alloy")) {
          setVoiceId(nextVoices[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load voices.");
      })
      .finally(() => {
        if (!cancelled) setLoadingVoices(false);
      });

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (sampleUrlRef.current) {
        URL.revokeObjectURL(sampleUrlRef.current);
      }
    };
  }, []);

  const playSample = async () => {
    if (!voiceId || playing) return;
    setPlaying(true);
    setError("");
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
    }
    if (sampleUrlRef.current) {
      URL.revokeObjectURL(sampleUrlRef.current);
      sampleUrlRef.current = null;
    }

    try {
      const blob = await fetchVoiceSample(voiceId);
      const url = URL.createObjectURL(blob);
      sampleUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      await audio.play();
    } catch {
      setError("Could not play this voice sample.");
      setPlaying(false);
    }
  };

  return (
    <Shell>
      <Card>
        <Title>Welcome</Title>
        <Copy>Choose a tutor voice, then play a short sample before you start.</Copy>
        <Label htmlFor="voice">Voice</Label>
        <Select
          id="voice"
          value={voiceId}
          disabled={loadingVoices || voices.length === 0}
          onChange={(event) => {
            if (audioRef.current) {
              audioRef.current.onended = null;
              audioRef.current.pause();
            }
            setPlaying(false);
            setVoiceId(event.target.value);
          }}
        >
          {voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </Select>
        <Actions>
          <ActionButton type="button" onClick={() => void playSample()} disabled={playing || !voiceId}>
            {playing ? "Playing…" : "Play"}
          </ActionButton>
          <ActionButton
            type="button"
            $primary
            disabled={!voiceId || loadingVoices}
            onClick={() => onContinue(voiceId)}
          >
            Continue
          </ActionButton>
        </Actions>
        <Message>{error}</Message>
      </Card>
    </Shell>
  );
}

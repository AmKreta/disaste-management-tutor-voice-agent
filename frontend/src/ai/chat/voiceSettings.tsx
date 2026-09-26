import styled from "@emotion/styled";
import { useEffect, useRef, useState } from "react";
import { fetchVoiceSample, fetchVoices, type VoiceOption } from "../../service/voiceApi";
import { Tooltip } from "../../ui/tooltip";
import { useAiStateStore } from "../store/useAiState";

const Wrap = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: ${({ $active }) => ($active ? "#eceff1" : "rgba(255, 255, 255, 0.92)")};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;

  svg {
    width: 18px;
    height: 18px;
    fill: #424242;
  }

  &:hover {
    background-color: #f5f5f5;
  }
`;

const Panel = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  width: 240px;
  padding: 14px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #616161;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const SelectWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const Select = styled.select`
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  padding: 8px 28px 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  font-size: 13px;
  line-height: 1.3;
  color: #111;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: #bdbdbd;
  }
`;

const SelectArrow = styled.span`
  position: absolute;
  top: 50%;
  right: 10px;
  width: 8px;
  height: 8px;
  pointer-events: none;
  transform: translateY(-65%) rotate(45deg);
  border-right: 1.5px solid #757575;
  border-bottom: 1.5px solid #757575;
`;

const PlayButton = styled.button`
  flex-shrink: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background-color: #eceff1;
  color: #111;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #c62828;
`;

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.81 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.93 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.69.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.26.12.55.02.69-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}

export function VoiceSettings() {
  const selectedVoice = useAiStateStore((state) => state.selectedVoice);
  const setSelectedVoice = useAiStateStore((state) => state.setSelectedVoice);
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sampleUrlRef = useRef<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetchVoices()
      .then((nextVoices) => {
        if (cancelled) return;
        setVoices(nextVoices);
        const currentVoice = useAiStateStore.getState().selectedVoice;
        if (
          nextVoices.length > 0 &&
          !nextVoices.some((voice) => voice.id === currentVoice)
        ) {
          setSelectedVoice(nextVoices[0].id);
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
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.pause();
      }
      if (sampleUrlRef.current) {
        URL.revokeObjectURL(sampleUrlRef.current);
      }
    };
  }, [setSelectedVoice]);

  const stopSample = () => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
    }
    setPlaying(false);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || wrapRef.current?.contains(target)) {
        return;
      }
      stopSample();
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const playSample = async () => {
    if (!selectedVoice || playing) return;
    stopSample();
    if (sampleUrlRef.current) {
      URL.revokeObjectURL(sampleUrlRef.current);
      sampleUrlRef.current = null;
    }
    setPlaying(true);
    setError("");

    try {
      const blob = await fetchVoiceSample(selectedVoice);
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
    <Wrap ref={wrapRef}>
      <Tooltip text={open ? "Close settings" : "Settings"}>
        <IconButton
          type="button"
          $active={open}
          onClick={() => {
            if (open) stopSample();
            setOpen((value) => !value);
          }}
          aria-label={open ? "Close settings" : "Open settings"}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      {open && (
        <Panel>
          <Label htmlFor="voice">Voice</Label>
          <Row>
            <SelectWrap>
              <Select
                id="voice"
                value={selectedVoice}
                disabled={loadingVoices || voices.length === 0}
                onChange={(event) => {
                  stopSample();
                  setSelectedVoice(event.target.value);
                }}
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </Select>
              <SelectArrow aria-hidden="true" />
            </SelectWrap>
            <PlayButton
              type="button"
              onClick={() => void playSample()}
              disabled={playing || !selectedVoice}
            >
              {playing ? "Playing…" : "Play"}
            </PlayButton>
          </Row>
          {error ? <Message>{error}</Message> : null}
        </Panel>
      )}
    </Wrap>
  );
}

import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useEffect, useRef } from "react";
import { LogKind, type VoiceSpeaker } from "../../ai/types";

const SIZE = 132;

const COLORS: Record<"user" | "bot" | "idle", string> = {
  user: "#2196f3",
  bot: "#4caf50",
  idle: "#90a4ae",
};

const GLOW: Record<"user" | "bot" | "idle", string> = {
  user: "rgba(33, 150, 243, 0.45)",
  bot: "rgba(76, 175, 80, 0.45)",
  idle: "rgba(144, 164, 174, 0.28)",
};

type Tone = keyof typeof COLORS;

function toneFor(speaker: VoiceSpeaker): Tone {
  if (speaker === LogKind.USER) return "user";
  if (speaker === LogKind.BOT) return "bot";
  return "idle";
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Wrap = styled.div<{ $tone: Tone }>`
  width: ${SIZE}px;
  height: ${SIZE}px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow:
    0 14px 28px ${({ $tone }) => GLOW[$tone]},
    0 6px 14px rgba(0, 0, 0, 0.12);
  animation: ${float} 3.2s ease-in-out infinite;
  transition: box-shadow 0.35s ease;
`;

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`;

export function SineOrb({ speaker }: { speaker: VoiceSpeaker }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speakerRef = useRef(speaker);
  speakerRef.current = speaker;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    let phase = 0;
    let color = parseHex(COLORS.idle);

    const draw = () => {
      const speaking = speakerRef.current !== null;
      const target = parseHex(COLORS[toneFor(speakerRef.current)]);
      color = mixRgb(color, target, 0.08);
      phase += speaking ? 0.085 : 0.032;
      const amplitude = speaking ? 18 : 8;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.strokeStyle = "#ffffff";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const layers = [
        { offset: 0, amp: 1, width: 2.2, alpha: 1 },
        { offset: 1.15, amp: 0.62, width: 1.6, alpha: 0.7 },
        { offset: 2.3, amp: 0.36, width: 1.2, alpha: 0.45 },
      ];

      for (const layer of layers) {
        ctx.beginPath();
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;
        for (let x = 0; x <= SIZE; x += 1) {
          const y =
            SIZE / 2 +
            Math.sin(x * 0.085 + phase + layer.offset) * amplitude * layer.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Wrap $tone={toneFor(speaker)}>
      <Canvas ref={canvasRef} />
    </Wrap>
  );
}

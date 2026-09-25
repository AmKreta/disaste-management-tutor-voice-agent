import styled from "@emotion/styled";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  text: string;
  children: ReactNode;
};

type Placement = "top" | "bottom";

const Trigger = styled.span`
  display: inline-flex;
  align-items: center;
`;

const Bubble = styled.dialog<{ $placement: Placement; $arrowLeft: number }>`
  position: fixed;
  inset: auto;
  margin: 0;
  max-width: min(240px, calc(100vw - 16px));
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;

  &::after {
    content: "";
    position: absolute;
    left: ${({ $arrowLeft }) => `${$arrowLeft}px`};
    transform: translateX(-50%);
    border: 5px solid transparent;
    ${({ $placement }) =>
      $placement === "top"
        ? `
      top: 100%;
      border-top-color: #333;
    `
        : `
      bottom: 100%;
      border-bottom-color: #333;
    `}
  }
`;

export function Tooltip({ text, children }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [placement, setPlacement] = useState<Placement>("top");
  const [arrowLeft, setArrowLeft] = useState(12);

  if (!text) {
    return <>{children}</>;
  }

  const place = () => {
    const trigger = triggerRef.current;
    const dialog = dialogRef.current;
    if (!trigger || !dialog) return;

    const rect = trigger.getBoundingClientRect();
    const tip = dialog.getBoundingClientRect();
    const gap = 8;
    const padding = 8;

    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tip.width - padding));

    let nextPlacement: Placement = "top";
    let top = rect.top - tip.height - gap;
    if (top < padding) {
      nextPlacement = "bottom";
      top = rect.bottom + gap;
    }

    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
    setPlacement(nextPlacement);
    setArrowLeft(rect.left + rect.width / 2 - left);
  };

  const show = () => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.show();
    }
    requestAnimationFrame(place);
  };

  const hide = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  return (
    <Trigger
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {createPortal(
        <Bubble ref={dialogRef} $placement={placement} $arrowLeft={arrowLeft}>
          {text}
        </Bubble>,
        document.body
      )}
    </Trigger>
  );
}

import styled from "@emotion/styled";
import { useRef, type ReactNode } from "react";

type TooltipProps = {
  text: string;
  children: ReactNode;
};

const Trigger = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const Bubble = styled.dialog`
  position: absolute;
  inset: auto;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  margin: 0;
  max-width: 240px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
  }
`;

export function Tooltip({ text, children }: TooltipProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!text) {
    return <>{children}</>;
  }

  const show = () => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.show();
    }
  };

  const hide = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  return (
    <Trigger onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <Bubble ref={dialogRef}>{text}</Bubble>
    </Trigger>
  );
}

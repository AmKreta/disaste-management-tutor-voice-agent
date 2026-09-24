import styled from "@emotion/styled";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "connect" | "disconnect" | "default";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantColors: Record<ButtonVariant, { background: string; color: string }> =
  {
    connect: { background: "#4caf50", color: "white" },
    disconnect: { background: "#f44336", color: "white" },
    default: { background: "#e0e0e0", color: "#111" },
  };

const StyledButton = styled.button<{ $variant: ButtonVariant }>`
  padding: 8px 16px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${({ $variant }) => variantColors[$variant].background};
  color: ${({ $variant }) => variantColors[$variant].color};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function Button({
  children,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <StyledButton $variant={variant} {...props}>
      {children}
    </StyledButton>
  );
}

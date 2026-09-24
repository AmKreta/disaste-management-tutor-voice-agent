import styled from "@emotion/styled";

type StatusProps = {
  label?: string;
  value: string;
};

const StatusText = styled.div`
  font-size: 14px;
`;

export function Status({ label = "Transport", value }: StatusProps) {
  return (
    <StatusText>
      {label}: <span>{value}</span>
    </StatusText>
  );
}

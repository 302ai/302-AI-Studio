import { DotPulse, LineSpinner } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import "ldrs/react/LineSpinner.css";

interface LdrsLoaderProps {
  type: "dot-pulse" | "line-spinner";
  size?: number;
  speed?: number;
  color?: string;
  stroke?: number;
}

export function LdrsLoader({
  type,
  size = 30,
  speed = 1,
  stroke = 2,
  color = "currentColor",
}: LdrsLoaderProps) {
  switch (type) {
    case "dot-pulse":
      return <DotPulse size={size} speed={speed} color={color} />;
    case "line-spinner":
      return (
        <LineSpinner size={size} speed={speed} color={color} stroke={stroke} />
      );
  }
}

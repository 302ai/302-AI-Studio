import { DotPulse } from 'ldrs/react';
import 'ldrs/react/DotPulse.css';

const PulseLoader = () => {
  return (
    <DotPulse
      size="30"
      speed="0.9"
      color="white"
    />
  );
};

export { PulseLoader };
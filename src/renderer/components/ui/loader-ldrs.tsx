import { Tailspin } from 'ldrs/react';
import 'ldrs/react/Tailspin.css';

const Spinner = () => {
  return (
    <Tailspin
      size="20"
      speed="0.9"
      color="white"
      stroke={3}
    />
  );
};

export { Spinner };
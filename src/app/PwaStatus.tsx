import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  useRegisterSW();

  return null;
}

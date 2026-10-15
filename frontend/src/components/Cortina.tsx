import { useSyncExternalStore } from 'react';
import { faseActual, suscribirse } from '../services/transicion';

// Panel terracota que se desliza para cubrir y descubrir la pantalla al cambiar de sección.
export default function Cortina() {
  const fase = useSyncExternalStore(suscribirse, faseActual);
  return <div className={`cortina cortina--${fase}`} aria-hidden="true" />;
}
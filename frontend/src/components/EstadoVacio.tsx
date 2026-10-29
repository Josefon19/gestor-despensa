import { IonIcon } from '@ionic/react';
import type { ReactNode } from 'react';
export default function EstadoVacio({ icono, titulo, children }: { icono: string; titulo: string; children: ReactNode }) {
  return <section className="estado-vacio"><span className="estado-vacio__icono"><IonIcon icon={icono} aria-hidden="true" /></span>
    <h2 className="titulo-serif">{titulo}</h2><div>{children}</div></section>;
}

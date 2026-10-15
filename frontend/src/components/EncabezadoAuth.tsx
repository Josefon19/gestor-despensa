import { IonIcon } from '@ionic/react';
import { basketOutline } from 'ionicons/icons';

// Bloque superior que comparten Login y Registro.
export default function EncabezadoAuth({ subtitulo }: { subtitulo: string }) {
  return (
    <div className="hero">
      <div className="hero__icono">
        <IonIcon icon={basketOutline} aria-hidden="true" />
      </div>
      <h1 className="hero__titulo titulo-serif">
        Gestor de Despensa
      </h1>
      <p className="hero__subtitulo">{subtitulo}</p>
    </div>
  );
}
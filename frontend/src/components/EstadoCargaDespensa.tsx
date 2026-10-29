import { IonButton } from '@ionic/react';
import { useDespensa } from '../modules/despensa/context';

export default function EstadoCargaDespensa() {
  const { cargando, errorCarga, recargar } = useDespensa();
  if (cargando) return <p role="status">Cargando tu despensa…</p>;
  if (errorCarga) return <section role="alert" className="nota-local"><p>{errorCarga}</p>
    <IonButton fill="clear" onClick={() => void recargar()}>Reintentar</IonButton></section>;
  return null;
}

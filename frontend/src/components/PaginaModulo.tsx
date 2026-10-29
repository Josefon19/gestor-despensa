import type { ReactNode } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
export default function PaginaModulo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <IonPage><IonHeader><IonToolbar><IonTitle>{titulo}</IonTitle></IonToolbar></IonHeader>
    <IonContent><main className="modulo-contenido">{children}</main></IonContent></IonPage>;
}

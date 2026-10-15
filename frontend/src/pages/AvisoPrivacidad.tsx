import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import TextoAviso from '../components/TextoAviso';

export default function AvisoPrivacidad() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Aviso de Privacidad</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <TextoAviso />
      </IonContent>
    </IonPage>
  );
}
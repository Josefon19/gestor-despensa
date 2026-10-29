import { Navigate, Route } from 'react-router-dom';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { bookOutline, cubeOutline, notificationsOutline, restaurantOutline, settingsOutline } from 'ionicons/icons';
import type { Usuario } from '../../services/auth';
import DespensaProvider from './DespensaProvider';
import Inventario from '../../pages/modulos/Inventario';
import Recetas from '../../pages/modulos/Recetas';
import Guias from '../../pages/modulos/Guias';
import Alertas from '../../pages/modulos/Alertas';
import Configuracion from '../../pages/modulos/Configuracion';
import '../../pages/Home.css';

export default function ModulosDespensa({ usuario, salir }: { usuario: Usuario; salir: () => Promise<void> }) {
  return <DespensaProvider usuario={usuario} salir={salir}>
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/home/inventario" element={<Inventario />} />
        <Route path="/home/preparaciones" element={<Inventario tipo="preparacion" />} />
        <Route path="/home/recetas" element={<Recetas />} />
        <Route path="/home/recetas/guias" element={<Guias />} />
        <Route path="/home/alertas" element={<Alertas />} />
        <Route path="/home/configuracion" element={<Configuracion />} />
        <Route path="/home" element={<Navigate to="/home/inventario" replace />} />
        <Route path="/home/*" element={<Navigate to="/home/inventario" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="despensa-tabs">
        <IonTabButton tab="inventario" href="/home/inventario"><IonIcon icon={cubeOutline} /><IonLabel>Inventario</IonLabel></IonTabButton>
        <IonTabButton tab="preparaciones" href="/home/preparaciones"><IonIcon icon={restaurantOutline} /><IonLabel>Preparaciones</IonLabel></IonTabButton>
        <IonTabButton tab="recetas" href="/home/recetas"><IonIcon icon={bookOutline} /><IonLabel>Recetas</IonLabel></IonTabButton>
        <IonTabButton tab="alertas" href="/home/alertas"><IonIcon icon={notificationsOutline} /><IonLabel>Alertas</IonLabel></IonTabButton>
        <IonTabButton tab="configuracion" href="/home/configuracion"><IonIcon icon={settingsOutline} /><IonLabel>Ajustes</IonLabel></IonTabButton>
      </IonTabBar>
    </IonTabs>
  </DespensaProvider>;
}

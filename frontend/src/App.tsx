import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Registro from './pages/Registro';

import '@ionic/react/css/padding.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

import AvisoPrivacidad from './pages/AvisoPrivacidad';
import Home from './pages/Home';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/registro" element={<Registro />} />
          <Route path="/aviso-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Navigate to="/registro" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
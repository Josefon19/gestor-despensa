import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import './theme/variables.css';
import './theme/estilos.css';

import Login from './pages/Login';
import Registro from './pages/Registro';
import AvisoPrivacidad from './pages/AvisoPrivacidad';
import Home from './pages/Home';
import RutaPrivada from './components/RutaPrivada';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/aviso-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/home" element={<RutaPrivada><Home /></RutaPrivada>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
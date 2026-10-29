import { IonButton } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
import PaginaModulo from '../../components/PaginaModulo';
import EstadoVacio from '../../components/EstadoVacio';
import EstadoCargaDespensa from '../../components/EstadoCargaDespensa';
import { useDespensa } from '../../modules/despensa/context';
import { estadoFecha, textoFecha } from '../../modules/despensa/fechas';
export default function Alertas() {
  const { registros, anticipacion, cargando, errorCarga } = useDespensa();
  if (cargando || errorCarga) return <PaginaModulo titulo="Alertas"><EstadoCargaDespensa /></PaginaModulo>;
  const pendientes = registros.filter((r) => ['vencido', 'pronto'].includes(estadoFecha(r.fechaLimite, anticipacion)))
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));
  return <PaginaModulo titulo="Alertas">
    <div className="modulo-intro"><span className="sobretitulo">LO QUE MERECE TU ATENCIÓN</span><h1 className="titulo-serif">Revisa tus fechas</h1><p>Se muestran las fechas vencidas y las que llegan en los próximos {anticipacion} días.</p></div>
    <p className="nota-local">Fechas de los registros guardados en tu cuenta. Las notificaciones al teléfono y las alertas de stock se conectarán después.</p>
    {!pendientes.length ? <EstadoVacio icono={notificationsOutline} titulo="Sin fechas pendientes"><p>{registros.length ? 'Ningún registro con fecha está dentro del periodo de aviso.' : 'Agrega alimentos o preparaciones con una fecha límite para verlos aquí.'}</p></EstadoVacio> : <ul className="lista-registros">{pendientes.map((r) => <li key={r.id} className={`tarjeta-modulo alerta-${estadoFecha(r.fechaLimite, anticipacion)}`}>
      <h2>{r.nombre}</h2><p>{textoFecha(r.fechaLimite)}</p><p>{r.lugar} · {r.cantidad} {r.unidad}</p>
      <IonButton fill="clear" routerLink={r.tipo === 'preparacion' ? '/home/preparaciones' : '/home/inventario'}>Revisar {r.tipo === 'preparacion' ? 'preparaciones' : 'inventario'}</IonButton>
    </li>)}</ul>}
    <IonButton expand="block" fill="outline" routerLink="/home/configuracion">Cambiar anticipación de avisos</IonButton>
  </PaginaModulo>;
}

import { IonButton, IonChip, IonLabel } from '@ionic/react';
import { bookOutline } from 'ionicons/icons';
import PaginaModulo from '../../components/PaginaModulo';
import EstadoVacio from '../../components/EstadoVacio';
import EstadoCargaDespensa from '../../components/EstadoCargaDespensa';
import { useDespensa } from '../../modules/despensa/context';
import { estadoFecha } from '../../modules/despensa/fechas';
export default function Recetas() {
  const { registros, anticipacion, cargando, errorCarga } = useDespensa();
  if (cargando || errorCarga) return <PaginaModulo titulo="Recetas y guías"><EstadoCargaDespensa /></PaginaModulo>;
  const ingredientes = registros.filter((r) => r.tipo === 'alimento' && estadoFecha(r.fechaLimite, anticipacion) === 'pronto');
  return <PaginaModulo titulo="Recetas y guías">
    <div className="modulo-intro"><span className="sobretitulo">APROVECHA LO QUE TIENES</span><h1 className="titulo-serif">Ideas para tu próxima comida</h1><p>Este será tu espacio para encontrar recetas con los ingredientes de tu despensa.</p></div>
    <section className="tarjeta-modulo"><h2>Ingredientes próximos a su fecha</h2>
      {ingredientes.length ? ingredientes.map((r) => <IonChip key={r.id}><IonLabel>{r.nombre}</IonLabel></IonChip>) : <p>Cuando registres alimentos próximos a su fecha, aparecerán aquí.</p>}
      <IonButton fill="clear" routerLink="/home/inventario">Ver inventario</IonButton>
    </section>
    <EstadoVacio icono={bookOutline} titulo="Las recetas llegan en la siguiente etapa"><p>La búsqueda de recetas estará disponible cuando conectemos Edamam. Todavía no hay resultados ni recomendaciones automáticas.</p></EstadoVacio>
    <section className="tarjeta-modulo"><h2>Cuida tus preparaciones</h2><p>Un espacio para las próximas guías de conservación y recalentado.</p><IonButton expand="block" fill="outline" routerLink="/home/recetas/guias">Explorar guías</IonButton></section>
  </PaginaModulo>;
}

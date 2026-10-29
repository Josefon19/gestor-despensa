import { IonButton } from '@ionic/react';
import PaginaModulo from '../../components/PaginaModulo';
export default function Guias() {
  return <PaginaModulo titulo="Conservación y recalentado">
    <IonButton fill="clear" routerLink="/home/recetas" routerDirection="back">Volver a recetas</IonButton>
    <div className="modulo-intro"><span className="sobretitulo">GUÍAS DE COCINA</span><h1 className="titulo-serif">Una segunda vida para tu comida</h1><p>El módulo está preparado para incorporar contenido revisado y fuentes de consulta.</p></div>
    {[['Conservación', 'Alacena, refrigeración y congelación según el alimento.'], ['Recalentado', 'Métodos según el platillo: sartén, horno, microondas o freidora de aire.'], ['Preparación semanal', 'Organización de porciones, recipientes y etiquetas.']].map(([titulo, descripcion]) => <section className="tarjeta-modulo" key={titulo}><span className="sobretitulo">PRÓXIMAMENTE</span><h2>{titulo}</h2><p>{descripcion}</p></section>)}
    <p className="nota-local">Las recomendaciones y los tiempos de conservación se incorporarán después de validar sus fuentes.</p>
  </PaginaModulo>;
}

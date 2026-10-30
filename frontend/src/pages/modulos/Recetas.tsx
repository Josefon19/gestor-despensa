import { useEffect, useRef, useState, type FormEvent } from 'react';
import { IonButton, IonChip, IonLabel, IonSpinner } from '@ionic/react';
import { bookOutline } from 'ionicons/icons';
import PaginaModulo from '../../components/PaginaModulo';
import EstadoVacio from '../../components/EstadoVacio';
import EstadoCargaDespensa from '../../components/EstadoCargaDespensa';
import { useDespensa } from '../../modules/despensa/context';
import { estadoFecha } from '../../modules/despensa/fechas';
import { buscarRecetas, type Receta } from '../../services/recetas';
export default function Recetas() {
  const { registros, anticipacion, cargando, errorCarga } = useDespensa();
  const [consulta, setConsulta] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [consultaUsada, setConsultaUsada] = useState('');
  const [soloProximos, setSoloProximos] = useState(false);
  const [error, setError] = useState('');
  const enCurso = useRef(false);
  const vigente = useRef(true);
  useEffect(() => { vigente.current = true; return () => { vigente.current = false; }; }, []);
  const buscar = async (evento: FormEvent) => {
    evento.preventDefault();
    const texto = consulta.trim();
    if (enCurso.current || texto.length < 2 || texto.length > 120) return;
    enCurso.current = true; setBuscando(true); setError(''); setRecetas([]); setBusqueda(texto); setConsultaUsada('');
    try { const datos = await buscarRecetas(texto); if (vigente.current) { setRecetas(datos.recetas); setConsultaUsada(datos.consultaUsada); } }
    catch (e) { if (vigente.current) setError(e instanceof Error ? e.message : 'No se pudieron buscar recetas.'); }
    finally { enCurso.current = false; if (vigente.current) setBuscando(false); }
  };
  if (cargando || errorCarga) return <PaginaModulo titulo="Recetas y guías"><EstadoCargaDespensa /></PaginaModulo>;
  const disponibles = registros.filter((r) => r.tipo === 'alimento' && r.cantidad > 0 && estadoFecha(r.fechaLimite, anticipacion) !== 'vencido')
    .sort((a, b) => Number(estadoFecha(b.fechaLimite, anticipacion) === 'pronto') - Number(estadoFecha(a.fechaLimite, anticipacion) === 'pronto') || (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999') || a.nombre.localeCompare(b.nombre));
  const nombres = new Set<string>();
  const ingredientes = disponibles.filter((r) => {
    if (soloProximos && estadoFecha(r.fechaLimite, anticipacion) !== 'pronto') return false;
    const nombre = r.nombre.trim().toLocaleLowerCase('es');
    if (nombres.has(nombre)) return false;
    nombres.add(nombre); return true;
  });
  return <PaginaModulo titulo="Recetas y guías">
    <div className="modulo-intro"><span className="sobretitulo">APROVECHA LO QUE TIENES</span><h1 className="titulo-serif">Ideas para tu próxima comida</h1><p>Busca recetas por ingrediente o por el platillo que quieras preparar.</p></div>
    <section className="tarjeta-modulo"><h2>Ingredientes de tu despensa</h2>
      <p>Toca un alimento para colocarlo en el buscador. Los próximos a su fecha aparecen primero.</p>
      <label className="campo-busqueda"><span>Mostrar ingredientes</span><select value={soloProximos ? 'proximos' : 'todos'} onChange={(e) => setSoloProximos(e.target.value === 'proximos')}><option value="todos">Todos los disponibles</option><option value="proximos">Próximos a su fecha ({anticipacion} días)</option></select></label>
      {ingredientes.length ? ingredientes.map((r) => <IonChip key={r.id} disabled={buscando} onClick={() => setConsulta(r.nombre.slice(0, 120))}><IonLabel>{r.nombre}{estadoFecha(r.fechaLimite, anticipacion) === 'pronto' ? ' · Próximo' : ''}</IonLabel></IonChip>) : <p>{soloProximos ? 'No hay alimentos próximos a su fecha. Cambia a Todos los disponibles para ver los demás.' : 'No hay alimentos disponibles para buscar. Agrega alimentos al inventario o revisa sus fechas.'}</p>}
      <p className="ayuda-campo">Se muestran alimentos con cantidad disponible, incluidos los que no tienen fecha. Las preparaciones y los alimentos con fecha vencida no aparecen aquí.</p>
      <IonButton fill="clear" routerLink="/home/inventario">Ver inventario</IonButton>
    </section>
    <form className="tarjeta-modulo formulario-registro" onSubmit={buscar}>
      <h2>Buscar con Edamam</h2>
      <label className="campo-busqueda"><span>Ingrediente o platillo</span><input type="search" enterKeyHint="search" placeholder="Ej. pollo, jitomate, arroz" minLength={2} maxLength={120} required value={consulta} disabled={buscando} onChange={(e) => setConsulta(e.target.value)} /></label>
      <p className="ayuda-campo">Puedes escribir en español: traducimos ingredientes comunes al buscar. Los nombres que no reconozcamos y el texto de las recetas se conservan en su idioma original.</p>
      <IonButton type="submit" expand="block" disabled={buscando || consulta.trim().length < 2}>{buscando ? <><IonSpinner name="crescent" /> Buscando…</> : 'Buscar recetas'}</IonButton>
      <a className="edamam-atribucion" href="https://developer.edamam.com/" target="_blank" rel="noopener noreferrer"><img src="/edamam-badge.svg" alt="Powered by Edamam" width="200" height="40" /></a>
    </form>
    <div aria-live="polite" aria-busy={buscando}>
      {consultaUsada && consultaUsada.toLocaleLowerCase() !== busqueda.toLocaleLowerCase() && <p className="nota-local">Búsqueda enviada a Edamam: {consultaUsada}</p>}
      {error && <p className="nota-local error-formulario" role="alert">{error}</p>}
      {!buscando && !error && busqueda && !recetas.length && <EstadoVacio icono={bookOutline} titulo="Sin recetas para esta búsqueda"><p>Prueba con otro ingrediente o una búsqueda más corta.</p></EstadoVacio>}
      {!!recetas.length && <><h2>Resultados para «{busqueda}»</h2><ul className="lista-registros">{recetas.map((r) => <li className="tarjeta-modulo" key={r.id}>
        {r.imagen && <img className="foto-registro" src={r.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" />}
        <h2>{r.nombre}</h2><p>Fuente: {r.fuente}</p>
        {(r.porciones || r.minutos) && <p>{r.porciones ? `${r.porciones} porciones` : ''}{r.porciones && r.minutos ? ' · ' : ''}{r.minutos ? `${r.minutos} minutos` : ''}</p>}
        {!!r.ingredientes.length && <details><summary>Ver ingredientes</summary><ul>{r.ingredientes.map((i, index) => <li key={index}>{i}</li>)}</ul></details>}
        <IonButton expand="block" fill="outline" href={r.url} target="_blank" rel="noopener noreferrer">Ver preparación en la fuente</IonButton>
      </li>)}</ul></>}
    </div>
    <section className="tarjeta-modulo"><h2>Cuida tus preparaciones</h2><p>Consulta nuestras guías de conservación y recalentado.</p><IonButton expand="block" fill="outline" routerLink="/home/recetas/guias">Explorar guías</IonButton></section>
  </PaginaModulo>;
}

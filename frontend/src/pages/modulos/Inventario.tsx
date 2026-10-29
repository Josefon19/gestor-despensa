import { useState } from 'react';
import { IonBadge, IonButton, IonIcon, IonModal, IonSearchbar, IonSelect, IonSelectOption, useIonAlert, useIonToast } from '@ionic/react';
import { addOutline, cubeOutline, restaurantOutline } from 'ionicons/icons';
import PaginaModulo from '../../components/PaginaModulo';
import EstadoVacio from '../../components/EstadoVacio';
import FormularioRegistro from '../../components/FormularioRegistro';
import { useDespensa } from '../../modules/despensa/context';
import { estadoFecha, textoFecha } from '../../modules/despensa/fechas';
import type { EstadoFecha, NuevoRegistro, RegistroDespensa, TipoRegistro } from '../../modules/despensa/types';

const etiquetas: Record<EstadoFecha, { texto: string; color: string }> = {
  vencido: { texto: 'Fecha vencida', color: 'danger' }, pronto: { texto: 'Próximo a vencer', color: 'warning' },
  enFecha: { texto: 'En fecha', color: 'success' }, sinFecha: { texto: 'Sin fecha', color: 'medium' },
};
export default function Inventario({ tipo = 'alimento' }: { tipo?: TipoRegistro }) {
  const { registros, guardar, eliminar, anticipacion, cargando, errorCarga, recargar, preferencias } = useDespensa();
  const [busqueda, setBusqueda] = useState('');
  const [lugar, setLugar] = useState('todos');
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<RegistroDespensa>();
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState<string>();
  const [formulario, setFormulario] = useState(0);
  const [confirmar] = useIonAlert();
  const [toast] = useIonToast();
  const preparaciones = tipo === 'preparacion';
  const propios = registros.filter((r) => r.tipo === tipo);
  const visibles = propios.filter((r) => r.nombre.toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')) && (lugar === 'todos' || r.lugar === lugar))
    .sort((a, b) => (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999'));
  const guardarRegistro = async (datos: NuevoRegistro, id?: string) => {
    await guardar(datos, id);
    void toast({ message: id ? 'Registro actualizado' : 'Registro guardado', duration: 2000, color: 'success' });
  };
  const abrirFormulario = (registro?: RegistroDespensa) => {
    setEditando(registro);
    setFormulario((numero) => numero + 1);
    setAbierto(true);
  };
  const borrar = async (id: string) => {
    setEliminando(id);
    try {
      await eliminar(id);
      void toast({ message: 'Registro eliminado', duration: 2000 });
    } catch (error) {
      void toast({ message: error instanceof Error ? error.message : 'No se pudo eliminar el registro', duration: 3000, color: 'danger' });
    } finally { setEliminando(undefined); }
  };
  const quitar = (registro: RegistroDespensa) => {
    void confirmar({ header: 'Eliminar registro', message: 'Se eliminará este registro de tu cuenta.', buttons: [
      { text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: () => {
        void borrar(registro.id);
      } },
    ] });
  };
  return <PaginaModulo titulo={preparaciones ? 'Mis preparaciones' : 'Mi inventario'}>
    <div className="modulo-intro"><span className="sobretitulo">{preparaciones ? 'MEAL PREP' : 'TU COCINA, EN ORDEN'}</span>
      <h1 className="titulo-serif">{preparaciones ? 'Lo que ya cocinaste' : 'Cada ingrediente cuenta'}</h1>
      <p>{preparaciones ? 'Organiza tus porciones y recipientes para la semana.' : 'Ten a la vista lo que guardas en tu alacena, refrigerador y congelador.'}</p>
    </div>
    {cargando && <p role="status">Cargando tu despensa…</p>}
    {errorCarga && <section role="alert" className="nota-local"><p>{errorCarga}</p><IonButton fill="clear" onClick={() => void recargar()}>Reintentar</IonButton></section>}
    <IonButton expand="block" disabled={cargando || !!errorCarga} onClick={() => abrirFormulario()}><IonIcon icon={addOutline} slot="start" />Agregar {preparaciones ? 'preparación' : 'alimento'}</IonButton>
    {propios.length > 0 && <>
      <div className="resumen-modulo"><strong>{propios.length}</strong> {preparaciones ? (propios.length === 1 ? 'preparación registrada' : 'preparaciones registradas') : (propios.length === 1 ? 'alimento registrado' : 'alimentos registrados')}<span>{propios.filter((r) => estadoFecha(r.fechaLimite, anticipacion) === 'pronto').length} próximos a vencer</span></div>
      <IonSearchbar aria-label="Buscar por nombre" placeholder="Buscar por nombre" value={busqueda} onIonInput={(e) => setBusqueda(e.detail.value ?? '')} />
      <IonSelect label="Ubicación" labelPlacement="stacked" fill="outline" value={lugar} onIonChange={(e) => setLugar(e.detail.value)}>
        <IonSelectOption value="todos">Todas las ubicaciones</IonSelectOption>
        {['Alacena', 'Refrigerador', 'Congelador'].map((l) => <IonSelectOption key={l} value={l}>{l}</IonSelectOption>)}
      </IonSelect>
    </>}
    {!cargando && !errorCarga && (visibles.length === 0 ? <EstadoVacio icono={preparaciones ? restaurantOutline : cubeOutline} titulo={propios.length ? 'Sin coincidencias' : preparaciones ? 'Tu semana empieza aquí' : 'Tu despensa está lista para empezar'}>
      <p>{propios.length ? 'Prueba con otro nombre o ubicación.' : preparaciones ? 'Agrega tu primera preparación con sus porciones y fecha de elaboración.' : 'Agrega tu primer alimento para comenzar a organizar tu cocina.'}</p>
    </EstadoVacio> : <ul className="lista-registros">{visibles.map((r) => {
      const etiqueta = etiquetas[estadoFecha(r.fechaLimite, anticipacion)];
      return <li key={r.id} className="tarjeta-modulo">
        {r.foto && <img className="foto-registro" src={r.foto.url} alt={r.nombre} loading="lazy" />}
        <div className="registro-cabecera"><h2>{r.nombre}</h2><IonBadge color={etiqueta.color}>{etiqueta.texto}</IonBadge></div>
        <p>{r.cantidad} {r.unidad} · {r.lugar}</p>
        {r.fechaElaboracion && <p>Preparado: <time dateTime={r.fechaElaboracion}>{r.fechaElaboracion}</time></p>}
        <p className="fecha-registro">{textoFecha(r.fechaLimite)}{r.fechaLimite && <> · <time dateTime={r.fechaLimite}>{r.fechaLimite}</time></>}</p>
        {r.notas && <p className="notas-registro">{r.notas}</p>}
        <div className="acciones-registro"><IonButton size="small" fill="outline" disabled={cargando || !!eliminando} aria-label={`Editar ${r.nombre}`} onClick={() => abrirFormulario(r)}>Editar</IonButton><IonButton size="small" fill="clear" color="danger" disabled={cargando || !!eliminando} aria-label={`Eliminar ${r.nombre}`} onClick={() => quitar(r)}>{eliminando === r.id ? 'Eliminando…' : 'Eliminar'}</IonButton></div>
      </li>;
    })}</ul>)}
    <p className="ayuda-campo">El semáforo compara las fechas que tú registras; no determina si un alimento es seguro para consumir.</p>
    <IonModal isOpen={abierto} canDismiss={!enviando} onDidDismiss={() => setAbierto(false)}>
      <FormularioRegistro key={formulario} tipo={tipo} registro={editando} cerrar={() => setAbierto(false)} guardar={guardarRegistro} enviando={enviando} setEnviando={setEnviando} diasPorDefecto={preparaciones ? preferencias.diasPreparaciones : preferencias.diasAlimentos} />
    </IonModal>
  </PaginaModulo>;
}

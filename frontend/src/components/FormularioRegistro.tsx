import { useEffect, useRef, useState, type FormEvent } from 'react';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { hoyLocal, sumarDias } from '../modules/despensa/fechas';
import { subirFoto } from '../services/despensa';
import CampoFecha from './CampoFecha';
import type { FotoRegistro, Lugar, NuevoRegistro, RegistroDespensa, TipoRegistro } from '../modules/despensa/types';
export default function FormularioRegistro({ tipo, registro, cerrar, guardar, enviando, setEnviando, diasPorDefecto = 3 }: {
  tipo: TipoRegistro; registro?: RegistroDespensa; cerrar: () => void;
  guardar: (datos: NuevoRegistro, id?: string) => Promise<void>;
  setEnviando: (valor: boolean) => void;
  enviando: boolean;
  diasPorDefecto?: number;
}) {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [cantidad, setCantidad] = useState(String(registro?.cantidad ?? 1));
  const [unidad, setUnidad] = useState(registro?.unidad ?? (tipo === 'preparacion' ? 'porciones' : 'piezas'));
  const [lugar, setLugar] = useState<Lugar>(registro?.lugar ?? (tipo === 'preparacion' ? 'Refrigerador' : 'Alacena'));
  const [fechaLimite, setFechaLimite] = useState(registro ? registro.fechaLimite : sumarDias(hoyLocal(), diasPorDefecto));
  const [fechaManual, setFechaManual] = useState(!!registro);
  const [fechaElaboracion, setFechaElaboracion] = useState(registro?.fechaElaboracion ?? hoyLocal());
  const [notas, setNotas] = useState(registro?.notas ?? '');
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState<File>();
  const [vistaFoto, setVistaFoto] = useState('');
  const [fotoSubida, setFotoSubida] = useState<FotoRegistro>();
  const entradaFoto = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!archivo) { setVistaFoto(''); return; }
    const url = URL.createObjectURL(archivo);
    setVistaFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);
  const seleccionarFoto = (foto?: File) => {
    if (!foto) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || foto.size > 5 * 1024 * 1024 || foto.size === 0) {
      setError('Selecciona una foto JPG, PNG o WebP de hasta 5 MB.');
      if (entradaFoto.current) entradaFoto.current.value = '';
      return;
    }
    setError(''); setArchivo(foto); setFotoSubida(undefined);
  };
  const cambiarElaboracion = (fecha: string) => {
    setFechaElaboracion(fecha);
    if (!fechaManual && fecha) setFechaLimite(sumarDias(fecha, Math.min(diasPorDefecto, 4)));
  };
  const enCurso = useRef(false);
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enCurso.current) return;
    setError('');
    if (!nombre.trim() || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
      setError('Escribe un nombre y una cantidad mayor que cero.'); return;
    }
    if (tipo === 'preparacion' && (!fechaElaboracion || fechaElaboracion > hoyLocal())) {
      setError('La fecha de preparación es obligatoria y no puede ser futura.'); return;
    }
    if (tipo === 'preparacion' && fechaLimite && fechaLimite < fechaElaboracion) {
      setError('La fecha límite no puede ser anterior a la preparación.'); return;
    }
    if (tipo === 'preparacion' && fechaLimite && fechaLimite > sumarDias(fechaElaboracion, 4)) {
      setError('La fecha planificada no puede superar 4 días desde la preparación.'); return;
    }
    enCurso.current = true;
    setEnviando(true);
    try {
      const foto = archivo ? fotoSubida ?? await subirFoto(archivo) : undefined;
      if (foto) setFotoSubida(foto);
      await guardar({ tipo, nombre: nombre.trim(), cantidad: Number(cantidad), unidad, lugar, fechaLimite,
        fechaElaboracion: tipo === 'preparacion' ? fechaElaboracion : '', notas: notas.trim(), ...(foto ? { foto } : {}) }, registro?.id);
      setEnviando(false);
      cerrar();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  };
  // Un modal no es una ruta. IonPage lo registraría en la pila de navegación
  // heredada y podría dejarlo con ion-page-invisible al abrirlo desde una pestaña.
  return <div className="ion-page">
    <IonHeader><IonToolbar><IonTitle>{registro ? 'Editar' : 'Agregar'} {tipo === 'preparacion' ? 'preparación' : 'alimento'}</IonTitle>
      <IonButtons slot="end"><IonButton disabled={enviando} onClick={cerrar}>Cancelar</IonButton></IonButtons></IonToolbar></IonHeader>
    <IonContent><form className="modulo-contenido formulario-registro" onSubmit={enviar}>
      <p className="nota-local">El registro se guardará en tu cuenta.</p>
      <IonInput disabled={enviando} label="Nombre" labelPlacement="stacked" fill="outline" maxlength={100} required value={nombre} onIonInput={(e) => setNombre(e.detail.value ?? '')} />
      <div className="campos-par"><IonInput disabled={enviando} label="Cantidad" labelPlacement="stacked" fill="outline" type="number" inputmode="decimal" min="0.01" step="any" required value={cantidad} onIonInput={(e) => setCantidad(e.detail.value ?? '')} />
        <IonSelect disabled={enviando} label="Unidad" labelPlacement="stacked" fill="outline" value={unidad} onIonChange={(e) => setUnidad(e.detail.value)}>
          {['piezas', 'kg', 'g', 'litros', 'ml', 'porciones', 'recipientes'].map((u) => <IonSelectOption key={u} value={u}>{u}</IonSelectOption>)}
        </IonSelect></div>
      <IonSelect disabled={enviando} label="Dónde lo guardas" labelPlacement="stacked" fill="outline" value={lugar} onIonChange={(e) => setLugar(e.detail.value)}>
        {['Alacena', 'Refrigerador', 'Congelador'].map((l) => <IonSelectOption key={l} value={l}>{l}</IonSelectOption>)}
      </IonSelect>
      {tipo === 'preparacion' && <CampoFecha etiqueta="Fecha de preparación" valor={fechaElaboracion} cambiar={cambiarElaboracion} obligatorio maximo={hoyLocal()} disabled={enviando} />}
      <CampoFecha etiqueta="Fecha límite planificada" valor={fechaLimite} cambiar={(fecha) => { setFechaLimite(fecha); setFechaManual(true); }} minimo={tipo === 'preparacion' ? fechaElaboracion : undefined} maximo={tipo === 'preparacion' && fechaElaboracion ? sumarDias(fechaElaboracion, 4) : undefined} disabled={enviando} />
      <p className="ayuda-campo">Por defecto: {diasPorDefecto} días{tipo === 'preparacion' ? '; máximo 4 desde la elaboración' : ''}. Es una fecha de organización: la etiqueta y las condiciones del alimento tienen prioridad.</p>
      <section className="campo-foto"><h2>Foto (opcional)</h2>
        <label className="selector-foto"><span className="boton-foto">{registro?.foto ? 'Cambiar foto' : 'Seleccionar foto'}</span>
          <input className="entrada-foto" ref={entradaFoto} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Foto opcional" disabled={enviando} onChange={(e) => seleccionarFoto(e.target.files?.[0])} />
          <span className="nombre-foto">{archivo?.name ?? 'Ninguna foto nueva seleccionada'}</span>
        </label>
        {(vistaFoto || registro?.foto?.url) && <img className="vista-foto" src={vistaFoto || registro?.foto?.url} alt="Vista previa de la foto del registro" />}
        {archivo && <IonButton fill="clear" size="small" disabled={enviando} onClick={() => { setArchivo(undefined); setFotoSubida(undefined); setError(''); if (entradaFoto.current) entradaFoto.current.value = ''; }}>Descartar selección</IonButton>}
        <p className="ayuda-campo">JPG, PNG o WebP · Máximo 5 MB. Se subirá a Cloudinary al guardar.</p>
      </section>
      <IonTextarea disabled={enviando} label="Notas (opcional)" labelPlacement="stacked" fill="outline" autoGrow maxlength={500} value={notas} onIonInput={(e) => setNotas(e.detail.value ?? '')} />
      {error && <p role="alert" className="error-formulario">{error}</p>}
      <IonButton expand="block" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : registro ? 'Guardar cambios' : 'Guardar registro'}</IonButton>
    </form></IonContent>
  </div>;
}

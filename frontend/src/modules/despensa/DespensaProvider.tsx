import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Usuario } from '../../services/auth';
import { listarRegistros, guardarRegistro, eliminarRegistro } from '../../services/despensa';
import { DespensaContext } from './context';
import { Preferences } from '@capacitor/preferences';
import { normalizarPreferencias, PREFERENCIAS_INICIALES } from './preferencias';
import type { NuevoRegistro, PreferenciasDespensa, RegistroDespensa } from './types';

export default function DespensaProvider({ usuario, salir, children }: {
  usuario: Usuario; salir: () => Promise<void>; children: ReactNode;
}) {
  const [registros, setRegistros] = useState<RegistroDespensa[]>([]);
  const [anticipacion, setAnticipacion] = useState(2);
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_INICIALES);
  const [preferenciasListas, setPreferenciasListas] = useState(false);
  useEffect(() => {
    let activo = true;
    setPreferenciasListas(false);
    Preferences.get({ key: `despensa-preferencias:${usuario.id}` }).then(({ value }) => {
      const datos = normalizarPreferencias(value ? JSON.parse(value) : null);
      if (activo) { setPreferencias(datos); setAnticipacion(datos.anticipacion); }
    }).catch(() => { if (activo) { setPreferencias(PREFERENCIAS_INICIALES); setAnticipacion(2); } })
      .finally(() => { if (activo) setPreferenciasListas(true); });
    return () => { activo = false; };
  }, [usuario.id]);
  const guardarPreferencias = async (datos: PreferenciasDespensa) => {
    const valores = normalizarPreferencias(datos);
    await Preferences.set({ key: `despensa-preferencias:${usuario.id}`, value: JSON.stringify(valores) });
    setPreferencias(valores);
    setAnticipacion(valores.anticipacion);
  };
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const versionCarga = useRef(0);
  const recargar = useCallback(async () => {
    const version = ++versionCarga.current;
    setCargando(true);
    setErrorCarga('');
    try {
      const datos = await listarRegistros();
      if (version === versionCarga.current) setRegistros(datos);
    } catch (error) {
      if (version === versionCarga.current) setErrorCarga(error instanceof Error ? error.message : 'No se pudo cargar la despensa');
    } finally {
      if (version === versionCarga.current) setCargando(false);
    }
  }, []);
  useEffect(() => {
    setRegistros([]);
    void recargar();
    return () => { versionCarga.current += 1; };
  }, [recargar, usuario.id]);

  const guardar = async (datos: NuevoRegistro, id?: string) => {
    const registro = await guardarRegistro(datos, id);
    versionCarga.current += 1;
    setCargando(false);
    setErrorCarga('');
    setRegistros((actuales) => id
      ? actuales.map((actual) => actual.id === id ? registro : actual)
      : [registro, ...actuales]);
  };
  const eliminar = async (id: string) => {
    await eliminarRegistro(id);
    versionCarga.current += 1;
    setCargando(false);
    setErrorCarga('');
    setRegistros((actuales) => actuales.filter((registro) => registro.id !== id));
  };
  const cerrar = async () => {
    await salir();
    versionCarga.current += 1;
    setRegistros([]);
    setAnticipacion(2);
  };
  return <DespensaContext.Provider value={{ usuario, registros, cargando: cargando || !preferenciasListas, errorCarga, recargar, anticipacion, setAnticipacion, preferencias, guardarPreferencias, guardar, eliminar, salir: cerrar }}>{children}</DespensaContext.Provider>;
}

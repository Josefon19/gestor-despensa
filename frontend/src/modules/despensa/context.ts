import { createContext, useContext } from 'react';
import type { Usuario } from '../../services/auth';
import type { NuevoRegistro, PreferenciasDespensa, RegistroDespensa } from './types';
export interface DespensaContextValue {
  usuario: Usuario;
  registros: RegistroDespensa[];
  cargando: boolean;
  errorCarga: string;
  recargar: () => Promise<void>;
  anticipacion: number;
  setAnticipacion: (dias: number) => void;
  preferencias: PreferenciasDespensa;
  guardarPreferencias: (preferencias: PreferenciasDespensa) => Promise<void>;
  guardar: (registro: NuevoRegistro, id?: string) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  salir: () => Promise<void>;
}
export const DespensaContext = createContext<DespensaContextValue | null>(null);
export function useDespensa() {
  const contexto = useContext(DespensaContext);
  if (!contexto) throw new Error('El módulo necesita el contexto de despensa');
  return contexto;
}

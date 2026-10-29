export type TipoRegistro = 'alimento' | 'preparacion';
export type Lugar = 'Alacena' | 'Refrigerador' | 'Congelador';
export type EstadoFecha = 'vencido' | 'pronto' | 'enFecha' | 'sinFecha';
export interface FotoRegistro { url: string; publicId: string; firma?: string }
export interface PreferenciasDespensa { diasAlimentos: number; diasPreparaciones: number; anticipacion: number }
export interface RegistroDespensa {
  id: string;
  tipo: TipoRegistro;
  nombre: string;
  cantidad: number;
  unidad: string;
  lugar: Lugar;
  fechaLimite: string;
  fechaElaboracion: string;
  notas: string;
  foto?: FotoRegistro;
}
export type NuevoRegistro = Omit<RegistroDespensa, 'id'>;

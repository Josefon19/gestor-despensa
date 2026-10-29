export default function CampoFecha({ etiqueta, valor, cambiar, minimo, maximo, obligatorio = false, disabled = false }: {
  etiqueta: string; valor: string; cambiar: (fecha: string) => void;
  minimo?: string; maximo?: string; obligatorio?: boolean; disabled?: boolean;
}) {
  return <label className="campo-fecha"><span>{etiqueta}</span>
    <input type="date" value={valor} onChange={(e) => cambiar(e.target.value)} min={minimo} max={maximo} required={obligatorio} disabled={disabled} />
  </label>;
}

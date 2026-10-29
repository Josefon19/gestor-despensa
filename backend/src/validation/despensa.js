const TIPOS = ['alimento', 'preparacion'];
const LUGARES = ['Alacena', 'Refrigerador', 'Congelador'];
const UNIDADES = ['piezas', 'kg', 'g', 'litros', 'ml', 'porciones', 'recipientes'];

function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function validarRegistro(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return { error: 'Formato de registro inválido' };
  }
  const { tipo, nombre, cantidad, unidad, lugar, fechaLimite = '', fechaElaboracion = '', notas = '' } = cuerpo;
  if (!TIPOS.includes(tipo) || !LUGARES.includes(lugar) || !UNIDADES.includes(unidad)) {
    return { error: 'Tipo, ubicación o unidad inválidos' };
  }
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
    return { error: 'El nombre es obligatorio y debe tener hasta 100 caracteres' };
  }
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 1_000_000) {
    return { error: 'La cantidad debe ser mayor que cero y no superar 1000000' };
  }
  if (typeof notas !== 'string' || notas.length > 500) return { error: 'Las notas deben tener hasta 500 caracteres' };
  if (typeof fechaLimite !== 'string' || (fechaLimite !== '' && !fechaValida(fechaLimite))) {
    return { error: 'La fecha límite debe ser una fecha válida (AAAA-MM-DD)' };
  }
  if (typeof fechaElaboracion !== 'string' || (fechaElaboracion !== '' && !fechaValida(fechaElaboracion))) {
    return { error: 'La fecha de preparación debe ser una fecha válida (AAAA-MM-DD)' };
  }
  if (tipo === 'preparacion' && !fechaElaboracion) return { error: 'Indica la fecha de preparación' };
  if (tipo === 'preparacion' && fechaLimite && fechaLimite < fechaElaboracion) {
    return { error: 'La fecha límite no puede ser anterior a la preparación' };
  }
  if (tipo === 'preparacion' && fechaLimite && (Date.parse(fechaLimite) - Date.parse(fechaElaboracion)) / 86400000 > 4) {
    return { error: 'La fecha planificada de una preparación no puede superar 4 días desde su elaboración' };
  }
  // Lista permitida: nunca se pasan operadores ni el propietario enviados por el cliente.
  return { datos: { tipo, nombre: nombre.trim(), cantidad, unidad, lugar, fechaLimite,
    fechaElaboracion: tipo === 'preparacion' ? fechaElaboracion : '', notas: notas.trim() } };
}

module.exports = { TIPOS, LUGARES, UNIDADES, fechaValida, validarRegistro };

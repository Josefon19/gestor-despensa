const fs = require('node:fs');
const path = require('node:path');
const Dispositivo = require('../models/DispositivoPush');
const Registro = require('../models/RegistroDespensa');

function mensajeria() {
  const { getApps, initializeApp, cert } = require('firebase-admin/app');
  const { getMessaging } = require('firebase-admin/messaging');
  let app = getApps().find((a) => a.name === 'despensa-push');
  if (!app) {
    try {
      const ruta = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!ruta) throw new Error();
      const cuenta = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', ruta), 'utf8'));
      if (cuenta.type !== 'service_account' || cuenta.project_id !== process.env.FIREBASE_PROJECT_ID) throw new Error();
      app = initializeApp({ credential: cert(cuenta), projectId: cuenta.project_id }, 'despensa-push');
    } catch {
      const error = new Error('Las notificaciones todavía no están configuradas en el servidor');
      error.status = 503;
      throw error;
    }
  }
  return getMessaging(app);
}
function fechaLocal(ahora, zonaHoraria) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora);
  const parte = (tipo) => partes.find((p) => p.type === tipo).value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}
function sumarDias(fecha, dias) {
  const valor = new Date(`${fecha}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}
const filtroDispositivo = (d) => ({ _id: d._id, usuario: d.usuario, token: d.token });
async function enviar(dispositivo, prueba = false) {
  try {
    return await mensajeria().send({
      token: dispositivo.token,
      notification: { title: prueba ? 'Notificaciones activadas' : 'Revisa las fechas de tu despensa', body: prueba ? 'Tu dispositivo ya puede recibir avisos de tu despensa.' : 'Tienes fechas vencidas o próximas. Abre Alertas para revisarlas.' },
      data: { usuarioId: String(dispositivo.usuario), destino: 'alertas' },
      android: { priority: 'high', ttl: 3600000, notification: { channelId: 'despensa-alertas', icon: 'ic_notificacion', tag: prueba ? 'despensa-prueba' : 'despensa-fechas' } },
    });
  } catch (error) {
    if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(error.code)) {
      await Dispositivo.deleteOne(filtroDispositivo(dispositivo));
      error.status = 410;
    }
    throw error;
  }
}
async function revisarDispositivo(dispositivo, ahora = new Date()) {
  const hoy = fechaLocal(ahora, dispositivo.zonaHoraria);
  const filtro = filtroDispositivo(dispositivo);
  const adquirido = await Dispositivo.findOneAndUpdate({ ...filtro, ultimoDiaAvisado: { $ne: hoy }, $or: [{ bloqueoHasta: { $exists: false } }, { bloqueoHasta: { $lte: ahora } }] }, { $set: { bloqueoHasta: new Date(ahora.getTime() + 120000) } }, { returnDocument: 'after' });
  if (!adquirido) return;
  try {
    const pendientes = await Registro.countDocuments({ usuario: dispositivo.usuario, fechaLimite: { $gt: '', $lte: sumarDias(hoy, dispositivo.anticipacion) } });
    if (pendientes) {
      await enviar(dispositivo);
      await Dispositivo.updateOne(filtro, { $set: { ultimoDiaAvisado: hoy } });
    }
  } finally { await Dispositivo.updateOne(filtro, { $unset: { bloqueoHasta: 1 } }); }
}
async function revisarAlertas() {
  for await (const dispositivo of Dispositivo.find().select('+token').cursor()) {
    try { await revisarDispositivo(dispositivo); }
    catch { console.error('No se pudo enviar un aviso de despensa; se reintentará en la siguiente revisión.'); }
  }
}
function iniciarAlertas() {
  const cron = require('node-cron');
  const horario = process.env.CRON_SCHEDULE || '0 8 * * *';
  if (!cron.validate(horario)) throw new Error('CRON_SCHEDULE no es válido');
  return cron.schedule(horario, revisarAlertas, { timezone: process.env.CRON_TIMEZONE || 'America/Mexico_City', noOverlap: true });
}
module.exports = { mensajeria, enviar, fechaLocal, sumarDias, revisarDispositivo, revisarAlertas, iniciarAlertas };

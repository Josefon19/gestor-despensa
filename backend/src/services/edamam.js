const { createHash } = require('node:crypto');
const fallo = (mensaje, status) => Object.assign(new Error(mensaje), { status });
function enlaceSeguro(valor, imagen = false) {
  try {
    const url = new URL(valor);
    if (url.username || url.password || !['https:', ...(imagen ? [] : ['http:'])].includes(url.protocol)) return '';
    return url.href;
  } catch { return ''; }
}
async function buscarRecetas(consulta, usuario) {
  const appId = process.env.EDAMAM_APP_ID?.trim();
  const appKey = process.env.EDAMAM_APP_KEY?.trim();
  if (!appId || !appKey) throw fallo('Falta configurar Edamam en el servidor. Agrega EDAMAM_APP_ID y EDAMAM_APP_KEY.', 503);
  const url = new URL('https://api.edamam.com/api/recipes/v2');
  url.search = new URLSearchParams({ type: 'public', q: consulta, app_id: appId, app_key: appKey }).toString();
  for (const campo of ['uri', 'label', 'image', 'url', 'source', 'ingredientLines', 'yield', 'totalTime']) url.searchParams.append('field', campo);
  const headers = { Accept: 'application/json' };
  // Solo para planes con Active User Tracking; nunca se envía el correo.
  if (process.env.EDAMAM_ACTIVE_USER_TRACKING === 'true') headers['Edamam-Account-User'] = createHash('sha256').update(String(usuario)).digest('hex').slice(0, 30);
  let respuesta;
  try { respuesta = await fetch(url, { headers, signal: AbortSignal.timeout(10000), redirect: 'error' }); }
  catch { throw fallo('Edamam no respondió a tiempo. Inténtalo nuevamente.', 502); }
  if ([401, 403].includes(respuesta.status)) throw fallo('Edamam rechazó el acceso. Revisa que las claves sean de Recipe Search API y que el plan esté activo.', 503);
  if (respuesta.status === 429) throw fallo('Se alcanzó el límite de búsquedas de Edamam. Espera antes de volver a intentar.', 429);
  if (!respuesta.ok) throw fallo('Edamam no pudo completar la búsqueda. Inténtalo nuevamente.', 502);
  let datos;
  try { datos = await respuesta.json(); } catch { throw fallo('Edamam devolvió una respuesta no válida.', 502); }
  if (!Array.isArray(datos.hits)) throw fallo('Edamam devolvió una respuesta no válida.', 502);
  // _links y las URLs de consulta contienen credenciales: nunca se devuelven.
  return datos.hits.slice(0, 20).flatMap((hit) => {
    const r = hit?.recipe;
    if (!r || typeof r.label !== 'string' || !r.label.trim()) return [];
    const url = enlaceSeguro(r.url);
    if (!url) return [];
    return [{ id: createHash('sha256').update(String(r.uri || url)).digest('hex').slice(0, 24),
      nombre: r.label.slice(0, 250), imagen: enlaceSeguro(r.image, true), url,
      fuente: typeof r.source === 'string' ? r.source.slice(0, 150) : 'Fuente original',
      ingredientes: Array.isArray(r.ingredientLines) ? r.ingredientLines.filter((i) => typeof i === 'string').slice(0, 60).map((i) => i.slice(0, 500)) : [],
      porciones: Number.isFinite(r.yield) && r.yield > 0 ? r.yield : null,
      minutos: Number.isFinite(r.totalTime) && r.totalTime > 0 ? r.totalTime : null,
    }];
  });
}
module.exports = { buscarRecetas };

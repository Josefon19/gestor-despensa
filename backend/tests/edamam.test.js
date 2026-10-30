const { buscarRecetas } = require('../src/services/edamam');
const fetchOriginal = global.fetch;
beforeEach(() => { process.env.EDAMAM_APP_ID = 'id-privado'; process.env.EDAMAM_APP_KEY = 'clave-privada'; delete process.env.EDAMAM_ACTIVE_USER_TRACKING; global.fetch = jest.fn(); });
afterAll(() => { global.fetch = fetchOriginal; });
const receta = { uri: 'edamam:receta', label: 'Chicken', image: 'https://imagenes.example/foto.jpg', source: 'Cocina', url: 'https://cocina.example/receta', ingredientLines: ['Chicken', 'Salt'], yield: 2, totalTime: 30, _links: { self: { href: 'https://api.edamam.com/?app_key=clave-privada' } } };
test('consulta la API v2, conserva las claves en el servidor y limita los campos públicos', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ hits: [{ recipe: receta }], _links: { next: 'clave-privada' } }) });
  const resultados = await buscarRecetas('chicken & rice', 'propietario');
  const [url, opciones] = global.fetch.mock.calls[0];
  expect(url.origin + url.pathname).toBe('https://api.edamam.com/api/recipes/v2');
  expect(url.searchParams.get('q')).toBe('chicken & rice');
  expect(url.searchParams.get('app_key')).toBe('clave-privada');
  expect(opciones.headers['Edamam-Account-User']).toBeUndefined();
  expect(JSON.stringify(resultados)).not.toContain('clave-privada');
  expect(resultados[0]).toEqual(expect.objectContaining({ nombre: 'Chicken', fuente: 'Cocina', ingredientes: ['Chicken', 'Salt'], porciones: 2, minutos: 30 }));
});
test('rechaza URLs ejecutables y normaliza campos no disponibles en el plan', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ hits: [null, { recipe: { ...receta, url: 'javascript:alert(1)' } }, { recipe: { ...receta, image: 'data:image/svg+xml,hola', yield: 0, totalTime: null, ingredientLines: null } }] }) });
  const resultados = await buscarRecetas('chicken', 'propietario');
  expect(resultados).toHaveLength(1);
  expect(resultados[0]).toEqual(expect.objectContaining({ imagen: '', ingredientes: [], porciones: null, minutos: null }));
});
test('sin credenciales no consume llamadas', async () => {
  delete process.env.EDAMAM_APP_KEY;
  await expect(buscarRecetas('chicken', 'propietario')).rejects.toMatchObject({ status: 503 });
  expect(global.fetch).not.toHaveBeenCalled();
});
test.each([[401, 503], [403, 503], [429, 429], [500, 502]])('maneja el estado remoto %i sin devolver datos internos', async (status, esperado) => {
  global.fetch.mockResolvedValue({ ok: false, status });
  await expect(buscarRecetas('chicken', 'propietario')).rejects.toMatchObject({ status: esperado });
});
test('los errores de conexión no filtran la URL con claves', async () => {
  global.fetch.mockRejectedValue(new Error('https://api.edamam.com?app_key=clave-privada'));
  await expect(buscarRecetas('chicken', 'propietario')).rejects.toThrow('Edamam no respondió');
});
test('un plan con seguimiento recibe un ID opaco de hasta 30 caracteres', async () => {
  process.env.EDAMAM_ACTIVE_USER_TRACKING = 'true';
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ hits: [] }) });
  await buscarRecetas('chicken', 'usuario@ejemplo.com');
  expect(global.fetch.mock.calls[0][1].headers['Edamam-Account-User']).toMatch(/^[a-f0-9]{30}$/);
});

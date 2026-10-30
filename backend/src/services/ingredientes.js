// Vocabulario de búsqueda, sin servicios externos ni credenciales adicionales.
// Las frases específicas se resuelven antes que las palabras individuales.
const grupos = {
  'chicken breast': ['pechuga de pollo', 'pechugas de pollo'],
  'ground beef': ['carne molida', 'carne de res molida'],
  'beef': ['carne de res', 'res'], 'pork': ['carne de cerdo', 'cerdo'],
  'chicken': ['pollo', 'pollos'], 'turkey': ['pavo'], 'fish': ['pescado', 'pescados'],
  'tuna': ['atun'], 'salmon': ['salmon'], 'shrimp': ['camaron', 'camarones'],
  'ham': ['jamon'], 'bacon': ['tocino'], 'sausage': ['salchicha', 'salchichas'],
  'egg': ['huevo', 'huevos'], 'milk': ['leche'], 'yogurt': ['yogur'],
  'cream cheese': ['queso crema'], 'cheese': ['queso', 'quesos'],
  'butter': ['mantequilla'], 'cream': ['crema'],
  'brown rice': ['arroz integral'], 'rice': ['arroz'],
  'black beans': ['frijoles negros', 'frijol negro'], 'beans': ['frijol', 'frijoles'],
  'lentils': ['lenteja', 'lentejas'], 'chickpeas': ['garbanzo', 'garbanzos'],
  'oats': ['avena'], 'wheat flour': ['harina de trigo'], 'flour': ['harina'],
  'corn flour': ['harina de maiz'], 'corn tortilla': ['tortilla de maiz', 'tortillas de maiz'],
  'flour tortilla': ['tortilla de harina', 'tortillas de harina'],
  'coconut milk': ['leche de coco'], 'coconut oil': ['aceite de coco'],
  'peanut butter': ['crema de cacahuate', 'mantequilla de mani'],
  'canned tuna': ['atun en lata'],
  'bread': ['pan'], 'noodles': ['fideos'], 'corn': ['elote', 'elotes', 'maiz'],
  'tomato puree': ['pure de tomate'], 'tomato': ['jitomate', 'jitomates', 'tomate', 'tomates'],
  'tomatillo': ['tomate verde', 'tomates verdes'],
  'red onion': ['cebolla morada', 'cebollas moradas'], 'onion': ['cebolla', 'cebollas'],
  'garlic': ['ajo', 'ajos'], 'potato': ['papa', 'papas', 'patata', 'patatas'],
  'sweet potato': ['camote', 'camotes'], 'carrot': ['zanahoria', 'zanahorias'],
  'zucchini': ['calabacita', 'calabacitas', 'calabacin'], 'pumpkin': ['calabaza'],
  'spinach': ['espinaca', 'espinacas'], 'lettuce': ['lechuga'], 'broccoli': ['brocoli'],
  'cauliflower': ['coliflor'], 'cabbage': ['col', 'repollo'], 'celery': ['apio'],
  'cucumber': ['pepino', 'pepinos'], 'bell pepper': ['pimiento', 'pimientos', 'pimiento morron'],
  'mushroom': ['champinon', 'champinones', 'hongo', 'hongos'],
  'avocado': ['aguacate', 'aguacates'], 'peas': ['chicharos', 'guisantes'],
  'green beans': ['ejotes'], 'green chili': ['chile verde'],
  'apple': ['manzana', 'manzanas'], 'banana': ['platano', 'platanos'],
  'orange': ['naranja', 'naranjas'], 'lime': ['limon', 'limones'],
  'lemon': ['limon amarillo'], 'strawberry': ['fresa', 'fresas'],
  'pineapple': ['pina'], 'watermelon': ['sandia'], 'melon': ['melon'],
  'peach': ['durazno', 'duraznos'], 'pear': ['pera', 'peras'], 'grapes': ['uva', 'uvas'],
  'olive oil': ['aceite de oliva'], 'vegetable oil': ['aceite vegetal'],
  'oil': ['aceite'], 'salt': ['sal'], 'black pepper': ['pimienta negra'],
  'pepper': ['pimienta'], 'sugar': ['azucar'], 'honey': ['miel'],
  'cinnamon': ['canela'], 'cumin': ['comino'], 'parsley': ['perejil'],
  'basil': ['albahaca'], 'oregano': ['oregano'], 'vinegar': ['vinagre'],
  'almonds': ['almendra', 'almendras'], 'peanuts': ['cacahuate', 'cacahuates'],
  'walnuts': ['nuez', 'nueces'], 'chicken broth': ['caldo de pollo'],
  'vegetable broth': ['caldo de verduras'], 'salad': ['ensalada'], 'soup': ['sopa'],
  'with': ['con'], 'and': ['y'],
};
const normalizar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const vocabulario = new Map(Object.entries(grupos).flatMap(([ingles, nombres]) => nombres.map((nombre) => [nombre, ingles])));
function traducirIngredientes(texto) {
  const palabras = [...texto.matchAll(/[\p{L}\p{N}]+/gu)];
  let resultado = '', cursor = 0;
  for (let i = 0; i < palabras.length; i++) {
    for (let cantidad = Math.min(5, palabras.length - i); cantidad >= 1; cantidad--) {
      const ultima = palabras[i + cantidad - 1];
      const fin = ultima.index + ultima[0].length;
      const fragmento = texto.slice(palabras[i].index, fin);
      // No combinar frases a través de comas u otros separadores.
      if (!/^[\p{L}\p{N}\s]+$/u.test(fragmento)) continue;
      const traduccion = vocabulario.get(normalizar(fragmento).replace(/\s+/g, ' '));
      if (!traduccion) continue;
      resultado += texto.slice(cursor, palabras[i].index) + traduccion;
      cursor = fin; i += cantidad - 1; break;
    }
  }
  return (resultado + texto.slice(cursor)).trim();
}
module.exports = { traducirIngredientes };

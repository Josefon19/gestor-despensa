const { traducirIngredientes } = require('../src/services/ingredientes');
test.each([
  ['Pollo con arroz', 'chicken with rice'],
  ['ATÚN y jitomates', 'tuna and tomato'],
  ['Pechuga de pollo con arroz integral', 'chicken breast with brown rice'],
  ['tomates verdes, cebolla morada', 'tomatillo, red onion'],
  ['chicken, rice', 'chicken, rice'],
  ['Huauzontle y queso', 'Huauzontle and cheese'],
  ['piña, champiñones y brócoli', 'pineapple, mushroom and broccoli'],
  ['salsa, tomate verde', 'salsa, tomatillo'],
  ['tortilla de maíz', 'corn tortilla'],
  ['  queso   crema ', 'cream cheese'],
  ['salmonella', 'salmonella'],
])('traduce %s sin modificar palabras desconocidas o fragmentos', (original, esperado) => {
  expect(traducirIngredientes(original)).toBe(esperado);
});

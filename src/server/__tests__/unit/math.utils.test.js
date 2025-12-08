// src/server/__tests__/unit/math.utils.test.js
import { mathUtils } from '../../src/utils/utilis';

describe('Math Utilities', () => {
  // Test 1: Suma
  test('Suma dos números correctamente', () => {
    expect(mathUtils.sum(2, 3)).toBe(5);
    expect(mathUtils.sum(-1, 1)).toBe(0);
    expect(mathUtils.sum(0, 0)).toBe(0);
  });
  
  // Test 2: Resta
  test('Resta dos números correctamente', () => {
    expect(mathUtils.subtract(5, 3)).toBe(2);
    expect(mathUtils.subtract(10, 10)).toBe(0);
  });
  
  // Test 3: Multiplicación
  test('Multiplica dos números correctamente', () => {
    expect(mathUtils.multiply(4, 3)).toBe(12);
    expect(mathUtils.multiply(0, 100)).toBe(0);
  });
  
  // Test 4: División con error
  test('Divide dos números correctamente', () => {
    expect(mathUtils.divide(10, 2)).toBe(5);
    expect(mathUtils.divide(9, 3)).toBe(3);
  });
  
  // Test 5: División por cero
  test('Lanza error al dividir por cero', () => {
    expect(() => mathUtils.divide(10, 0)).toThrow('No se puede dividir por cero');
  });
});
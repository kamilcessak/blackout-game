import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processXpGain } from './xp';

test('dodaje XP bez awansu, gdy poniżej progu', () => {
  const result = processXpGain(0, 1, 50);
  assert.deepEqual(result, { xp: 50, level: 1, leveledUp: false });
});

test('awansuje poziom po osiągnięciu progu (level * 100)', () => {
  const result = processXpGain(90, 1, 10);
  assert.deepEqual(result, { xp: 0, level: 2, leveledUp: true });
});

test('przenosi nadwyżkę XP na kolejny poziom', () => {
  const result = processXpGain(0, 1, 130);
  assert.deepEqual(result, { xp: 30, level: 2, leveledUp: true });
});

test('obsługuje awans o wiele poziomów naraz', () => {
  // poz.1 wymaga 100, poz.2 wymaga 200 → 300 XP daje dokładnie poziom 3
  const result = processXpGain(0, 1, 300);
  assert.deepEqual(result, { xp: 0, level: 3, leveledUp: true });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistance } from './distance';

test('zwraca 0 dla tego samego punktu', () => {
  assert.equal(calculateDistance(50.0, 21.0, 50.0, 21.0), 0);
});

test('liczy ~111 km na jeden stopień szerokości', () => {
  const meters = calculateDistance(50.0, 21.0, 51.0, 21.0);
  // ~111.2 km — dopuszczamy 1 km tolerancji.
  assert.ok(Math.abs(meters - 111_195) < 1_000, `otrzymano ${meters} m`);
});

test('jest symetryczna', () => {
  const a = calculateDistance(50.0, 21.0, 50.1, 21.1);
  const b = calculateDistance(50.1, 21.1, 50.0, 21.0);
  assert.equal(a, b);
});

test('mały dystans mieści się w progu lootowania 50 m', () => {
  // ~0.0003 stopnia ≈ 33 m
  const meters = calculateDistance(50.0, 21.0, 50.0003, 21.0);
  assert.ok(meters < 50, `otrzymano ${meters} m`);
});

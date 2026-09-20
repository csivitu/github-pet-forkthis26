const test = require('node:test');
const assert = require('node:assert/strict');
const { getPetMood } = require('./mood.js');

test('active streak keeps pet happy during the day', () => {
  assert.equal(getPetMood(0, 4, true), 'Happy');
});

test('inactive streak returns sleepy once no activity today', () => {
  assert.equal(getPetMood(0, 4, false), 'Sleepy');
});

test('seven-day streak still stays motivated if active today', () => {
  assert.equal(getPetMood(0, 7, true), 'Motivated');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCongestion, median, detectAnomalies, movingAverage, trafficStats, validateSensorReadings } from '../src/index.js';

test('classifies traffic speed at each congestion level', () => {
  assert.equal(classifyCongestion(55), 'free-flow');
  assert.equal(classifyCongestion(35), 'moderate');
  assert.equal(classifyCongestion(20), 'heavy');
  assert.equal(classifyCongestion(5), 'severe');
});
test('rejects invalid congestion thresholds', () => assert.throws(() => classifyCongestion(20, { moderate: 10, heavy: 20, severe: 5 }), RangeError));
test('calculates median for odd and even arrays', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});
test('detects an extreme outlier using MAD', () => {
  const result = detectAnomalies([30, 31, 29, 30, 32, 150]);
  assert.equal(result.anomalies.length, 1);
  assert.equal(result.anomalies[0].value, 150);
});
test('returns trailing moving averages', () => assert.deepEqual(movingAverage([10, 20, 30, 40], 2), [10, 15, 25, 35]));
test('summarizes traffic speeds', () => assert.deepEqual(trafficStats([10, 20, 30]), { count: 3, min: 10, max: 30, average: 20, median: 20 }));
test('validates and normalizes sensor readings', () => {
  const result = validateSensorReadings([
    { sensorId: ' S-1 ', speed: 35, timestamp: '2026-11-17T10:00:00Z' },
    { sensorId: '', speed: -1, timestamp: 'not-a-date' }
  ]);
  assert.equal(result.isValid, false);
  assert.equal(result.valid[0].sensorId, 'S-1');
  assert.equal(result.errors.length, 1);
});
test('rejects empty numeric arrays', () => assert.throws(() => median([]), TypeError));

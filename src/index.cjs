'use strict';

function assertFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number`);
}
function assertNumericArray(values, name = 'values') {
  if (!Array.isArray(values) || values.length === 0) throw new TypeError(`${name} must be a non-empty array`);
  values.forEach((value, index) => assertFiniteNumber(value, `${name}[${index}]`));
}
function classifyCongestion(speed, thresholds = {}) {
  assertFiniteNumber(speed, 'speed');
  const { moderate = 40, heavy = 25, severe = 10 } = thresholds;
  [moderate, heavy, severe].forEach((v, i) => assertFiniteNumber(v, `threshold ${i + 1}`));
  if (!(moderate > heavy && heavy > severe && severe >= 0)) throw new RangeError('thresholds must satisfy moderate > heavy > severe >= 0');
  if (speed <= severe) return 'severe';
  if (speed <= heavy) return 'heavy';
  if (speed <= moderate) return 'moderate';
  return 'free-flow';
}
function median(values) {
  assertNumericArray(values);
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function detectAnomalies(values, options = {}) {
  assertNumericArray(values);
  const { threshold = 3.5, minMad = 1e-9 } = options;
  assertFiniteNumber(threshold, 'threshold'); assertFiniteNumber(minMad, 'minMad');
  if (threshold <= 0 || minMad <= 0) throw new RangeError('threshold and minMad must be greater than 0');
  const center = median(values), mad = median(values.map(value => Math.abs(value - center)));
  const anomalies = mad < minMad ? [] : values.flatMap((value, index) => {
    const score = 0.6745 * (value - center) / mad;
    return Math.abs(score) > threshold ? [{ index, value, score }] : [];
  });
  return { median: center, mad, anomalies };
}
function movingAverage(values, windowSize = 3) {
  assertNumericArray(values);
  if (!Number.isInteger(windowSize) || windowSize < 1) throw new RangeError('windowSize must be a positive integer');
  return values.map((_, index) => { const window = values.slice(Math.max(0, index - windowSize + 1), index + 1); return window.reduce((a, b) => a + b, 0) / window.length; });
}
function trafficStats(speeds) {
  assertNumericArray(speeds, 'speeds');
  const sorted = [...speeds].sort((a, b) => a - b);
  return { count: speeds.length, min: sorted[0], max: sorted[sorted.length - 1], average: speeds.reduce((a, b) => a + b, 0) / speeds.length, median: median(speeds) };
}
function validateSensorReadings(readings) {
  if (!Array.isArray(readings)) throw new TypeError('readings must be an array');
  const errors = [], valid = [];
  readings.forEach((reading, index) => {
    const issues = [];
    if (!reading || typeof reading !== 'object' || Array.isArray(reading)) issues.push('reading must be an object');
    else {
      if (typeof reading.sensorId !== 'string' || reading.sensorId.trim() === '') issues.push('sensorId must be a non-empty string');
      if (typeof reading.speed !== 'number' || !Number.isFinite(reading.speed) || reading.speed < 0) issues.push('speed must be a finite non-negative number');
      if (reading.timestamp === undefined || reading.timestamp === null || Number.isNaN(Date.parse(reading.timestamp))) issues.push('timestamp must be a valid date/time');
    }
    if (issues.length) errors.push({ index, issues });
    else valid.push({ sensorId: reading.sensorId.trim(), speed: reading.speed, timestamp: new Date(reading.timestamp).toISOString() });
  });
  return { valid, errors, isValid: errors.length === 0 };
}
module.exports = { classifyCongestion, median, detectAnomalies, movingAverage, trafficStats, validateSensorReadings };

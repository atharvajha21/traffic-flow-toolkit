/**
 * Traffic Flow Toolkit
 * Small, dependency-free helpers for working with traffic sensor readings.
 */

function assertFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function assertNumericArray(values, name = 'values') {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError(`${name} must be a non-empty array`);
  }
  values.forEach((value, index) => assertFiniteNumber(value, `${name}[${index}]`));
}

/** Classify a speed reading into free-flow, moderate, heavy, or severe traffic. */
export function classifyCongestion(speed, thresholds = {}) {
  assertFiniteNumber(speed, 'speed');
  const { moderate = 40, heavy = 25, severe = 10 } = thresholds;
  [moderate, heavy, severe].forEach((v, i) => assertFiniteNumber(v, `threshold ${i + 1}`));
  if (!(moderate > heavy && heavy > severe && severe >= 0)) {
    throw new RangeError('thresholds must satisfy moderate > heavy > severe >= 0');
  }
  if (speed <= severe) return 'severe';
  if (speed <= heavy) return 'heavy';
  if (speed <= moderate) return 'moderate';
  return 'free-flow';
}

/** Return the median of a non-empty numeric array. */
export function median(values) {
  assertNumericArray(values);
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Detect outliers using the robust median absolute deviation (MAD) method.
 * Returns the median, MAD, and flagged values with their original indexes.
 */
export function detectAnomalies(values, options = {}) {
  assertNumericArray(values);
  const { threshold = 3.5, minMad = 1e-9 } = options;
  assertFiniteNumber(threshold, 'threshold');
  assertFiniteNumber(minMad, 'minMad');
  if (threshold <= 0 || minMad <= 0) throw new RangeError('threshold and minMad must be greater than 0');

  const center = median(values);
  const deviations = values.map(value => Math.abs(value - center));
  const mad = median(deviations);
  const anomalies = mad < minMad
    ? []
    : values.flatMap((value, index) => {
        const modifiedZScore = 0.6745 * (value - center) / mad;
        return Math.abs(modifiedZScore) > threshold
          ? [{ index, value, score: modifiedZScore }]
          : [];
      });
  return { median: center, mad, anomalies };
}

/** Calculate a trailing moving average; the first values use the available prefix. */
export function movingAverage(values, windowSize = 3) {
  assertNumericArray(values);
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new RangeError('windowSize must be a positive integer');
  }
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = values.slice(start, index + 1);
    return window.reduce((sum, value) => sum + value, 0) / window.length;
  });
}

/** Summarize a non-empty list of traffic speeds (km/h). */
export function trafficStats(speeds) {
  assertNumericArray(speeds, 'speeds');
  const total = speeds.reduce((sum, speed) => sum + speed, 0);
  const sorted = [...speeds].sort((a, b) => a - b);
  return {
    count: speeds.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: total / speeds.length,
    median: median(speeds)
  };
}

/** Validate and normalize sensor readings with { sensorId, speed, timestamp }. */
export function validateSensorReadings(readings) {
  if (!Array.isArray(readings)) throw new TypeError('readings must be an array');
  const errors = [];
  const valid = [];
  readings.forEach((reading, index) => {
    const issues = [];
    if (!reading || typeof reading !== 'object' || Array.isArray(reading)) {
      issues.push('reading must be an object');
    } else {
      if (typeof reading.sensorId !== 'string' || reading.sensorId.trim() === '') issues.push('sensorId must be a non-empty string');
      if (typeof reading.speed !== 'number' || !Number.isFinite(reading.speed) || reading.speed < 0) issues.push('speed must be a finite non-negative number');
      if (reading.timestamp === undefined || reading.timestamp === null || Number.isNaN(Date.parse(reading.timestamp))) issues.push('timestamp must be a valid date/time');
    }
    if (issues.length) errors.push({ index, issues });
    else valid.push({ sensorId: reading.sensorId.trim(), speed: reading.speed, timestamp: new Date(reading.timestamp).toISOString() });
  });
  return { valid, errors, isValid: errors.length === 0 };
}

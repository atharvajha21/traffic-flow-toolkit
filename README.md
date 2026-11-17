# Traffic Flow Toolkit

A lightweight, dependency-free JavaScript/Node.js library for common traffic-sensor data tasks. It provides congestion classification, robust outlier detection using median absolute deviation (MAD), moving averages, traffic summaries, and sensor-reading validation.

## Requirements

- Node.js 18 or newer
- No runtime dependencies

## Installation

```bash
npm install traffic-flow-toolkit-atharva
```

## Quick start (ES modules)

```js
import {
  classifyCongestion,
  detectAnomalies,
  movingAverage,
  trafficStats,
  validateSensorReadings
} from 'traffic-flow-toolkit-atharva';

console.log(classifyCongestion(22)); // 'heavy'
console.log(detectAnomalies([30, 31, 29, 30, 32, 150]));
console.log(movingAverage([10, 20, 30, 40], 2)); // [10, 15, 25, 35]
console.log(trafficStats([10, 20, 30]));

const validation = validateSensorReadings([
  { sensorId: 'S-01', speed: 32, timestamp: '2026-11-17T10:00:00Z' }
]);
console.log(validation.isValid); // true
```

## CommonJS

```js
const { classifyCongestion, trafficStats } = require('traffic-flow-toolkit-atharva');
console.log(classifyCongestion(8)); // 'severe'
console.log(trafficStats([18, 22, 25]));
```

## API

### `classifyCongestion(speed, thresholds?)`
Classifies a speed in km/h. Default boundaries: `<= 10` severe, `<= 25` heavy, `<= 40` moderate, otherwise free-flow. Optional thresholds: `{ moderate, heavy, severe }` and must satisfy `moderate > heavy > severe >= 0`.

### `detectAnomalies(values, options?)`
Uses the modified Z-score based on median absolute deviation (MAD). Returns `{ median, mad, anomalies }`; each anomaly contains its original `index`, `value`, and `score`. Options: `{ threshold: 3.5, minMad: 1e-9 }`.

### `median(values)`
Returns the median of a non-empty numeric array.

### `movingAverage(values, windowSize?)`
Returns a trailing moving average. Defaults to a window size of 3; the initial values use the available prefix.

### `trafficStats(speeds)`
Returns `{ count, min, max, average, median }` for a non-empty numeric array of speeds.

### `validateSensorReadings(readings)`
Validates objects with `sensorId` (non-empty string), `speed` (finite non-negative number), and `timestamp` (parseable date/time). Returns `{ valid, errors, isValid }`; valid timestamps are normalized to ISO strings.

## Testing

```bash
npm test
```

The project uses Node.js's built-in test runner and has no third-party dependencies.

## Example use in Gridlock

The `examples/gridlock-integration.js` file demonstrates how a traffic-prediction application can consume recent sensor speeds to generate a congestion label, anomaly report, and descriptive statistics.

## License

MIT

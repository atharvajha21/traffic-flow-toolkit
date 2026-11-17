// Example integration for the Spatio-Temporal-Traffic-Mobility-Predictor project.
import { classifyCongestion, detectAnomalies, trafficStats } from 'traffic-flow-toolkit-atharva';

const recentSpeeds = [42, 39, 41, 38, 12, 40];
const summary = trafficStats(recentSpeeds);
const anomalyReport = detectAnomalies(recentSpeeds);

console.log({
  summary,
  currentCongestion: classifyCongestion(recentSpeeds.at(-1)),
  anomalyReport
});

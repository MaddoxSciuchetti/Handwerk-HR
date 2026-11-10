import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

function reportWebVital(metric: Metric) {
  const rounded = Math.round(metric.value);
  performance.mark(`web-vital:${metric.name}`, {
    detail: {
      id: metric.id,
      value: metric.value,
      rating: metric.rating,
    },
  });
  console.info(`[web-vital] ${metric.name}`, rounded, metric.rating);
}

export function reportWebVitals() {
  onCLS(reportWebVital);
  onINP(reportWebVital);
  onLCP(reportWebVital);
  onTTFB(reportWebVital);
}

const startedAt = Date.now();

type RouteMetric = {
  path: string;
  method: string;
  hits: number;
  errors: number;
  avgMs: number;
  lastStatus: number;
  lastHitAt: string;
};

const routeMap = new Map<string, RouteMetric>();

export function recordRequestMetric(input: { path: string; method: string; durationMs: number; status: number }) {
  const key = `${input.method}:${input.path}`;
  const existing = routeMap.get(key);
  if (!existing) {
    routeMap.set(key, {
      path: input.path,
      method: input.method,
      hits: 1,
      errors: input.status >= 400 ? 1 : 0,
      avgMs: input.durationMs,
      lastStatus: input.status,
      lastHitAt: new Date().toISOString()
    });
    return;
  }
  existing.avgMs = Number((((existing.avgMs * existing.hits) + input.durationMs) / (existing.hits + 1)).toFixed(1));
  existing.hits += 1;
  existing.errors += input.status >= 400 ? 1 : 0;
  existing.lastStatus = input.status;
  existing.lastHitAt = new Date().toISOString();
}

export function getApiMetrics() {
  const routes = Array.from(routeMap.values())
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);

  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    totalHits: routes.reduce((sum, item) => sum + item.hits, 0),
    totalErrors: routes.reduce((sum, item) => sum + item.errors, 0),
    routes
  };
}
